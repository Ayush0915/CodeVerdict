# Python Secure Coding Guidelines

## Section 1: Injection Prevention

### 1.1 SQL Injection Prevention
- Never construct SQL queries dynamically using string formatting, concatenation, or interpolation of user input.
- Always use parameterized queries (prepared statements) where the database driver automatically escapes input parameters.
- Example of safe database access:
  ```python
  # Safe: Using query parameters
  cursor.execute("SELECT * FROM users WHERE username = %s", (user_input,))
  ```

### 1.2 Command Injection Prevention
- Avoid running system commands with `shell=True` using the `subprocess` module.
- When `shell=True` is enabled, the shell interprets character sequences like `;`, `&&`, or `|` which lets attackers execute arbitrary programs.
- Avoid passing raw shell strings. Always pass arguments as a list and run with `shell=False`.
- Example of safe command execution:
  ```python
  # Safe: shell=False and command arguments as list
  subprocess.Popen(["ls", "-l", directory_name], shell=False)
  ```

---

## Section 2: Credential and Secret Management

### 2.1 Hardcoded Secrets
- Never hardcode authentication tokens, API keys, database passwords, or symmetric encryption keys in the codebase.
- Use environment variables or specialized secret stores to retrieve sensitive variables at runtime.
- Example of safe loading:
  ```python
  # Safe: Load from environment variables
  db_password = os.environ.get("DATABASE_PASSWORD")
  ```

---

## Section 3: Safe Deserialization

### 3.1 Dangerous Pickling
- Never load untrusted data using the standard `pickle` module. Pickled data can contain execution payloads that trigger arbitrary code execution upon loading.
- Use safe representation formats like JSON, YAML (with `yaml.safe_load`), or Protocol Buffers when interacting with untrusted data.
- Example of safe parsing:
  ```python
  # Safe: parsing JSON instead of pickling
  data = json.loads(untrusted_input)
  ```

---

## Section 4: Safe Path Operations

### 4.1 Path Traversal
- Validate all user-supplied paths to prevent directory traversal attacks (e.g., `../../etc/passwd`).
- Use `os.path.abspath` or `Path.resolve` and check that the resulting absolute path is inside the intended base directory.
- Example of safe validation:
  ```python
  # Safe: checking path prefix
  base_dir = Path("/app/data").resolve()
  target = Path(base_dir, user_filename).resolve()
  if not target.startswith(base_dir):
      raise PermissionError("Directory traversal detected")
  ```
