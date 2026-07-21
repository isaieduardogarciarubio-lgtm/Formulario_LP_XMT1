/**
 * Motor de encriptación — AES-256-GCM con passphrase compartido.
 * Protege el CSV mientras viaja fuera de Grid (correo/Slack/USB) antes de
 * subirse al dashboard de consolidado. El passphrase se pide una sola vez
 * por sesión de navegador (sessionStorage) y nunca se guarda en disco.
 */
class CryptoEngine {
  static SESSION_KEY = 'audit_passphrase';

  static async deriveKey(passphrase, saltBytes) {
    const enc = new TextEncoder();
    const material = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 100000 },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static toBase64(bytes) {
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  static fromBase64(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  /**
   * Encripta texto plano y retorna un JSON string con la estructura
   * { v, salt, iv, data, ts }. El salt y el iv son aleatorios por archivo
   * y no son secretos — solo el passphrase lo es.
   */
  static async encryptText(text, passphrase, kind = 'csv') {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));

    return JSON.stringify({
      v: 1,
      kind, // 'csv' (texto plano) o 'zip' (base64 de un blob binario)
      salt: this.toBase64(salt),
      iv: this.toBase64(iv),
      data: this.toBase64(new Uint8Array(ciphertext)),
      ts: new Date().toISOString(),
    });
  }

  /**
   * Desencripta un JSON string generado por encryptText(). Lanza error si
   * el passphrase es incorrecto (AES-GCM falla la verificación de la
   * etiqueta de autenticación) o si el archivo está corrupto.
   */
  static async decryptText(jsonText, passphrase) {
    const payload = JSON.parse(jsonText);
    if (payload.v !== 1) throw new Error('Versión de encriptación no soportada');

    const salt = this.fromBase64(payload.salt);
    const iv = this.fromBase64(payload.iv);
    const data = this.fromBase64(payload.data);
    const key = await this.deriveKey(passphrase, salt);

    const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(plainBuffer);
  }

  /**
   * Encripta un Blob binario (ej. un ZIP) codificándolo a base64 y
   * reutilizando encryptText(). Retorna el mismo JSON string de siempre.
   */
  static async encryptBlob(blob, passphrase) {
    const buffer = await blob.arrayBuffer();
    const base64Content = this.toBase64(new Uint8Array(buffer));
    return this.encryptText(base64Content, passphrase, 'zip');
  }

  static getSessionPassphrase() {
    return sessionStorage.getItem(this.SESSION_KEY) || null;
  }

  static setSessionPassphrase(passphrase) {
    sessionStorage.setItem(this.SESSION_KEY, passphrase);
  }

  static clearSessionPassphrase() {
    sessionStorage.removeItem(this.SESSION_KEY);
  }
}

/**
 * Gate de UI: pide el passphrase una sola vez por sesión y lo cachea.
 * Se usa antes de cada exportación encriptada.
 */
class CryptoGate {
  static ensurePassphrase() {
    const existing = CryptoEngine.getSessionPassphrase();
    if (existing) return Promise.resolve(existing);
    return this.promptPassphrase();
  }

  static promptPassphrase() {
    return new Promise((resolve, reject) => {
      const overlay = document.createElement('div');
      overlay.className = 'passphrase-modal-overlay';
      overlay.innerHTML = `
        <div class="passphrase-modal-card">
          <h3>Contraseña de encriptación</h3>
          <p>Ingresa la contraseña compartida para proteger este archivo mientras viaja fuera de Grid. Pregúntale a un administrador si no la tienes.</p>
          <p style="font-size: 0.82rem; color: var(--color-error, #ff453a); margin-top: -8px;">
            Verifica que sea la contraseña vigente. Si escribes una distinta a la configurada por tu admin, el archivo se generará sin error, pero <strong>no podrá desencriptarse</strong> después en el dashboard.
          </p>
          <input type="password" id="passphrase-input" placeholder="Contraseña" autocomplete="off" />
          <div class="passphrase-modal-actions">
            <button type="button" class="btn btn-secondary" id="passphrase-cancel">Cancelar</button>
            <button type="button" class="btn btn-primary" id="passphrase-confirm">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const input = overlay.querySelector('#passphrase-input');
      input.focus();

      const cleanup = () => overlay.remove();

      overlay.querySelector('#passphrase-confirm').addEventListener('click', () => {
        const value = input.value.trim();
        if (!value) return;
        CryptoEngine.setSessionPassphrase(value);
        cleanup();
        resolve(value);
      });

      overlay.querySelector('#passphrase-cancel').addEventListener('click', () => {
        cleanup();
        reject(new Error('Operación cancelada'));
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') overlay.querySelector('#passphrase-confirm').click();
      });
    });
  }
}
