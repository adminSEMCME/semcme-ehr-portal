const splitWords = (value: string) => value.trim().split(/\s+/).filter(Boolean);

export const hasAtLeastTwoWords = (value: string) =>
  splitWords(value).length >= 2;

export const normalizeInstitutionName = (value: string) =>
  splitWords(value)
    .map((word) =>
      word
        .toLowerCase()
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("-"),
    )
    .join(" ");
