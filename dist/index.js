"use strict";
class SecureDataEntry {
    constructor(data) {
        this.originalData = data;
        // Generate a unique canary token for this data instance
        this.canaryToken = crypto.randomUUID();
        // Generate a one-time encryption key
        this.tempKey = this.generateTempKey();
        // Initialize encryption key
        this.encryptionKey = await this.generateEncryptionKey();
    }
    async generateEncryptionKey() {
        return await crypto.subtle.generateKey({
            name: "AES-GCM",
            length: 256
        }, true, ["encrypt", "decrypt"]);
    }
    generateTempKey() {
        return crypto.randomUUID();
    }
    async encrypt(data) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(data);
        const encryptedData = await crypto.subtle.encrypt({
            name: "AES-GCM",
            iv
        }, this.encryptionKey, encodedData);
        return this.arrayBufferToBase64(encryptedData);
    }
    getSecureString() {
        // Insert canary token into data in a way that preserves format
        const segments = this.originalData.split('');
        // Insert canary data at specific intervals while maintaining format
        const augmentedData = this.insertCanaryData(segments, this.canaryToken);
        // Create a self-contained validator
        const validator = new DataValidator(this.canaryToken, this.tempKey);
        // Start monitoring for unauthorized access
        validator.startMonitoring();
        return augmentedData;
    }
    insertCanaryData(segments, canary) {
        const result = [...segments];
        // Insert canary bits between valid characters while maintaining format
        for (let i = 0; i < canary.length; i++) {
            const position = this.calculateInsertPosition(i, result.length);
            result.splice(position, 0, this.encodeCanaryBit(canary[i]));
        }
        return result.join('');
    }
    encodeCanaryBit(bit) {
        // Encode canary bit as a valid but traceable character
        // This could use various Unicode combining characters or format preserving encryption
        return String.fromCharCode(0x200B + bit.charCodeAt(0) % 2);
    }
}
class DataValidator {
    constructor(canaryToken, tempKey) {
        this.interval = null;
        this.canaryToken = canaryToken;
        this.tempKey = tempKey;
    }
    startMonitoring() {
        // Set up mutation observer to detect DOM changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (this.detectUnauthorizedAccess(mutation)) {
                    this.triggerAutoEncryption();
                }
            });
        });
        // Monitor for clipboard events
        document.addEventListener('copy', this.handleCopy.bind(this));
        document.addEventListener('cut', this.handleCopy.bind(this));
        // Check periodically for data exposure
        this.interval = setInterval(() => {
            this.scanForExposure();
        }, 1000);
    }
    // Handle copy and cut events
    handleCopy(event) {
        // Get the clipboard content (data that is being copied or cut)
        const clipboardData = event.clipboardData?.getData('text');
        if (clipboardData) {
            console.log('Clipboard content:', clipboardData);
            // You could add additional logic here, e.g., encrypting the copied data
            // or alerting the user when sensitive data is copied.
            if (this.containsSensitiveDataInClipboard(clipboardData)) {
                alert('Sensitive data detected in clipboard!');
            }
        }
    }
    containsSensitiveDataInClipboard(data) {
        // Check if clipboard data contains the canary token
        return data.includes(this.canaryToken);
    }
    async detectUnauthorizedAccess(mutation) {
        // Check if sensitive data is being modified or accessed
        const nodes = Array.from(mutation.addedNodes);
        return nodes.some(node => this.containsSensitiveData(node) && !this.isAuthorizedContext());
    }
    containsSensitiveData(node) {
        // Check if node contains our canary token
        const content = node.textContent || '';
        return this.extractCanaryBits(content).includes(this.canaryToken);
    }
    extractCanaryBits(text) {
        // Extract and reconstruct canary bits from the text
        return text
            .split('')
            .filter(char => this.isCanaryChar(char))
            .map(char => this.decodeCanaryBit(char))
            .join('');
    }
    isCanaryChar(char) {
        const code = char.charCodeAt(0);
        return code >= 0x200B && code <= 0x200D;
    }
    decodeCanaryBit(char) {
        return String.fromCharCode(((char.charCodeAt(0) - 0x200B) + 48));
    }
    async triggerAutoEncryption() {
        // Encrypt the data without requiring server communication
        const elements = this.findSensitiveElements();
        for (const element of elements) {
            if (element.textContent) {
                const encrypted = await this.localEncrypt(element.textContent);
                element.textContent = encrypted;
            }
        }
    }
    findSensitiveElements() {
        // Find all elements containing our canary token
        return Array.from(document.querySelectorAll('*'))
            .filter(element => this.containsSensitiveData(element));
    }
    async localEncrypt(data) {
        // Perform local encryption using the temp key
        const encoder = new TextEncoder();
        const keyData = encoder.encode(this.tempKey);
        const key = await crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['encrypt']);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt({
            name: 'AES-GCM',
            iv
        }, key, encoder.encode(data));
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    }
    cleanup() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
