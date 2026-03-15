export function stripJsonComments(input: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const current = input[index];
    const next = input[index + 1];

    if (!inString && current === "/" && next === "/") {
      index += 2;
      while (index < input.length && input[index] !== "\n") {
        index += 1;
      }
      if (index < input.length) {
        output += "\n";
      }
      continue;
    }

    if (!inString && current === "/" && next === "*") {
      index += 2;
      while (index < input.length && !(input[index] === "*" && input[index + 1] === "/")) {
        index += 1;
      }
      index += 1;
      continue;
    }

    output += current;

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      continue;
    }

    if (current === '"') {
      inString = true;
    }
  }

  return output;
}

export function parseJsonc<T>(input: string): T {
  return JSON.parse(stripJsonComments(input)) as T;
}
