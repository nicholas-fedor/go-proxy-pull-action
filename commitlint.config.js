export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-min-length": [2, "always", 10],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
  },
};
