"use client";

import React from "react";
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h1>Error happened: {error.message}</h1>

      <button onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
