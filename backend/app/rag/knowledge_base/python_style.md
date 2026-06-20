# Python Style and Quality Guidelines

## Section 1: Naming Conventions and Coding Standards (PEP 8)

### 1.1 Variable, Function, and Method Names
- Use `snake_case` for variable names, function names, and method names.
- Do not use uppercase letters, camelCase, or single-character variables except in short loops.
- Function names should be active and descriptive, expressing what they do.

### 1.2 Class Names
- Use `PascalCase` (CapWords) for all class names.
- Example: `class SynthesizerAgent:` rather than `class synthesizer_agent:`.

### 1.3 Constants
- Use `UPPERCASE_WITH_UNDERSCORES` for constants defined at the module level.
- Example: `MAX_RETRIES = 3`.

---

## Section 2: Complexity and Duplication (DRY Principle)

### 2.1 Code Duplication
- Don't Repeat Yourself (DRY). Avoid copy-pasting code fragments. If the same or highly similar logic is used in two or more places, extract it into a helper function or common class method.
- Reusing code decreases maintenance cost and reduces surface area for bugs.

### 2.2 Cognitive and Cyclomatic Complexity
- Keep functions short and single-purposed (Single Responsibility Principle). A function should ideally be less than 50 lines.
- Avoid deep nested loops and complex branching structures (`if/elif/else` nested three or more levels deep).
- Refactor deep nesting by introducing early returns or guard clauses.
- Example of guard clauses:
  ```python
  # Better: Guard clauses
  def process_transaction(user, amount):
      if not user.is_active:
          return False
      if amount <= 0:
          return False
      # Perform processing...
      return True
  ```

---

## Section 3: Robust Exception Handling

### 3.1 Avoid Bare Except Blocks
- Never use a bare `except:` block. This catches unexpected exceptions like `SystemExit` or `KeyboardInterrupt`, making it difficult to stop programs or debug root issues.
- Always specify the concrete exception class, e.g., `except ValueError:` or at least `except Exception:` for general runtime errors.
- Always log the stack trace or exception message when catching exceptions at higher application layers.
- Example of correct exception handling:
  ```python
  # Safe: specific exception class
  try:
      value = int(user_input)
  except ValueError as e:
      logger.warning(f"Invalid integer format: {e}")
      value = 0
  ```
