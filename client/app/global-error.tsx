"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  console.log("this is the critical issue: ", error.message);
  return (
    <html>
      <body>
        <h1>Critical error</h1>
        <button onClick={reset}>
          Reload app
        </button>
      </body>
    </html>
  );
}
