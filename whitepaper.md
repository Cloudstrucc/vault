# Digital Vault - Cloudstrucc

1. Generates unique fingerprinted versions of the sensitive data using:

   - Digital watermarking techniques
   - Added entropy in non-visible positions
   - Cryptographic signatures
2. Testing/Experimenting will include:

   - Take the original string (e.g. "123-456-789")
   - Generate a unique identifier for each use/form
   - Combine them in a way that preserves the valid format but contains traceable elements
   - Store the mapping of these identifiers in your vault

This provides:

- Reliable tracing without relying on potentially unstable Unicode tricks
- Better compatibility with existing systems
- More control over the fingerprinting mechanism
- Ability to definitively prove the source of any leaked data

The key is focusing on cryptographically sound methods rather than trying to exploit character encoding quirks which could fail unpredictably while at the same time not be coupled to online access and be fully self secured on any operating system or device that can access digital data (exception, for now, physical pictures of this data)

Technical approach that could work (example starting point using node.js)

```javascript
class SecureDataEntry {
  private readonly originalData: string;
  private readonly canaryToken: string;
  private readonly encryptionKey: CryptoKey;
  private readonly tempKey: string;
  
  constructor(data: string) {
    this.originalData = data;
    // Generate a unique canary token for this data instance
    this.canaryToken = crypto.randomUUID();
    // Generate a one-time encryption key
    this.tempKey = this.generateTempKey();
    // Initialize encryption key
    this.encryptionKey = await this.generateEncryptionKey();
  }

  private async generateEncryptionKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  private generateTempKey(): string {
    return crypto.randomUUID();
  }

  private async encrypt(data: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);
  
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      this.encryptionKey,
      encodedData
    );

    return this.arrayBufferToBase64(encryptedData);
  }

  public getSecureString(): string {
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

  private insertCanaryData(segments: string[], canary: string): string {
    const result = [...segments];
    // Insert canary bits between valid characters while maintaining format
    for (let i = 0; i < canary.length; i++) {
      const position = this.calculateInsertPosition(i, result.length);
      result.splice(position, 0, this.encodeCanaryBit(canary[i]));
    }
    return result.join('');
  }

  private encodeCanaryBit(bit: string): string {
    // Encode canary bit as a valid but traceable character
    // This could use various Unicode combining characters or format preserving encryption
    return String.fromCharCode(0x200B + bit.charCodeAt(0) % 2);
  }
}

class DataValidator {
  private readonly canaryToken: string;
  private readonly tempKey: string;
  private interval: number | null = null;

  constructor(canaryToken: string, tempKey: string) {
    this.canaryToken = canaryToken;
    this.tempKey = tempKey;
  }

  public startMonitoring(): void {
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

  private async detectUnauthorizedAccess(mutation: MutationRecord): boolean {
    // Check if sensitive data is being modified or accessed
    const nodes = Array.from(mutation.addedNodes);
    return nodes.some(node => 
      this.containsSensitiveData(node) && !this.isAuthorizedContext()
    );
  }

  private containsSensitiveData(node: Node): boolean {
    // Check if node contains our canary token
    const content = node.textContent || '';
    return this.extractCanaryBits(content).includes(this.canaryToken);
  }

  private extractCanaryBits(text: string): string {
    // Extract and reconstruct canary bits from the text
    return text
      .split('')
      .filter(char => this.isCanaryChar(char))
      .map(char => this.decodeCanaryBit(char))
      .join('');
  }

  private isCanaryChar(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 0x200B && code <= 0x200D;
  }

  private decodeCanaryBit(char: string): string {
    return String.fromCharCode(
      ((char.charCodeAt(0) - 0x200B) + 48)
    );
  }

  private async triggerAutoEncryption(): Promise<void> {
    // Encrypt the data without requiring server communication
    const elements = this.findSensitiveElements();
    for (const element of elements) {
      if (element.textContent) {
        const encrypted = await this.localEncrypt(element.textContent);
        element.textContent = encrypted;
      }
    }
  }

  private findSensitiveElements(): Element[] {
    // Find all elements containing our canary token
    return Array.from(document.querySelectorAll('*'))
      .filter(element => this.containsSensitiveData(element));
  }

  private async localEncrypt(data: string): Promise<string> {
    // Perform local encryption using the temp key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.tempKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      'AES-GCM',
      false,
      ['encrypt']
    );
  
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encoder.encode(data)
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  public cleanup(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
```

## How this system would work

1. When sensitive data is stored in the vault:
   - Generates a unique canary token for that piece of data
   - Creates a temporary encryption key stored in memory
   - Inserts invisible zero-width characters containing the canary data between the actual characters
2. When the data is used in a form:
   - The canary characters are maintained but don't affect the visual appearance or validation
   - A DataValidator monitors the DOM for unauthorized access/copying
   - Uses Mutation Observers and event listeners to detect data exposure
3. If unauthorized sharing is detected:
   - The validator detects the presence of the canary token in an unauthorized context
   - Triggers local encryption using the temporary key without server communication
   - The data becomes encrypted automatically

### Key security features

- No server communication required
- No recipient integration needed
- Completely invisible to the form/recipient
- Self-contained encryption capability
- Format-preserving to maintain validity
- Uses standard Web Crypto API for cryptographic operations

### Considering limitations

1. The encryption is one-way since it's designed for protection rather than recovery
2. Very sophisticated attackers might detect the presence of zero-width characters
3. Some systems might strip zero-width characters (though we could use other Unicode techniques which we will expand on next)

## The Science Behind Canaries (1 consideration)

1. **Origin and Concept:**
   - Derived from the historical use of canary birds in mines to detect toxic gases
   - In cybersecurity, they're "tripwires" that signal unauthorized access
   - The key is creating unique, traceable markers that are:
     - Invisible to normal users
     - Difficult to remove accidentally
     - Easy to detect programmatically
2. **Entropy and Information Theory:**
   - Uses Claude Shannon's information theory principles
   - Each canary bit provides:
     - Unique identification
     - Temporal information
     - Contextual metadata
   - The encoding must maintain high entropy while appearing random

### Alternative Unicode Techniques

1. **Combining Diacritical Marks (0x0300-0x036F):**

    ```typescript
    char + String.fromCharCode(0x0301) // Adds an acute accent
    ```

    - Advantages: Very common in normal text
    - Disadvantages: Might be normalized by some systems

2. **Variation Selectors (0xFE00-0xFE0F):**

    ```typescript
    char + String.fromCharCode(0xFE00) // Adds a variation selector
    ```

    - Advantages: Designed for text modification
    - Disadvantages: Better preserved than zero-width chars

3. **Combining Ligature Marks (0xFE20-0xFE2F):**

    ```typescript
    char + String.fromCharCode(0xFE20) // Adds a half ligature
    ```

    - Advantages: Less likely to be stripped
    - Disadvantages: More visible in some fonts

4. **Mathematical Invisible Operators (0x2061-0x2064):**

    ```typescript
    char + String.fromCharCode(0x2061) // Adds function application
    ```

    - Advantages: Very rarely stripped
    - Disadvantages: Limited number available

#### The explored implementation provided uses multiple strategies simultaneously to improve resilience

1. **Strategy Rotation**:
   - Cycles through different Unicode techniques
   - Makes pattern detection harder
   - Improves survival if one method is stripped
2. **Contextual Adaptation**:
   - Analyzes the text content
   - Chooses most appropriate technique
   - Maintains format validity
3. **Error Detection**:
   - Uses redundant encoding
   - Can recover from partial stripping
   - Maintains canary integrity

##### To address the limitations more specifically

1. **Format Preservation**:

   - Use combining characters that don't affect layout
   - Choose marks that are common in the target language
   - Implement fallback strategies
2. **Resilience**:

   - Multiple encoding techniques
   - Redundant data distribution
   - Error correction coding
3. **Detection Avoidance**:

   - Randomized insertion patterns
   - Natural language analysis
   - Context-aware encoding

### Real world application example

1. Initial Data Entry:

   - When you enter your info into Amazon's form, the vault would:
   - Insert the canary tokens into your personal data using multiple Unicode techniques
   - Each piece of data (name, address, etc.) gets unique tokens
   - The data looks normal to Amazon's systems but contains invisible markers

2. Detection Mechanism:

   - The vault monitors for your marked data appearing outside authorized domains through:
   - Web scraping detection
   - API call monitoring
   - Cross-domain tracking
   - Looking for the canary tokens in unexpected contexts

3. Alert & Action Flow:

```markdown
  Your Data → Amazon → Unauthorized Marketing API
     ↓
  Vault detects canary tokens in new domain 
     ↓
  Alert sent to your device/vault app
     ↓
  You decline sharing
     ↓
  Trigger local encryption
```

However, there are important limitations to note:

1. Technical Constraints:

   - Once data is on Amazon's servers, we can't directly encrypt it there
   - The encryption would only affect future uses of the data
   - Servers could strip Unicode markers before storing

2. More Realistic Protection Model:

   - Instead of trying to encrypt data on third-party servers (which isn't possible), you could:
   - Generate unique versions of your data for each service
   - Track which version appears where
   - Identify the source of any leaks
   - Have legal recourse with proof of unauthorized sharing
   - Invalidate compromised versions of your data

#### Potential limitations to surmount

1. "Can't directly encrypt on Amazon's servers":
   A possible research direction could be developing a homomorphic encryption-like approach where:

   - The data stored has both a visible and "shadow" state
   - The shadow state remains encrypted but functionally identical
   - When unauthorized sharing occurs, the shadow state could become primary
   - This could leverage trusted execution environments (TEE) or secure enclaves

2. "Encryption only affecting future uses":
   Some research vectors:

   - Develop a time-bound data representation where each instance has a built-in expiration
   - Create "quantum-inspired" data states where observation changes the data's form
   - Research retroactive encryption techniques using blockchain-like propagation
   - Explore memory-mapped data structures that maintain references to original sources

3. "Servers stripping Unicode markers":
   Beyond Unicode, we could research:

   - DNA-inspired data encoding where information survives transformation
   - Stenographic techniques that survive standard sanitization
   - Format-preserving encryption that maintains valid data structure while encoding protection
   - Polymorphic markers that can adapt to server processing

Note: Given this is research, we need to document and consider the following:

- Consider ethical implications
- Test against various adversarial scenarios
- Develop clear boundaries for legitimate use
