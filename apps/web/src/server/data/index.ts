/**
 * Data layer. Every page reads through these functions.
 *
 * Phase 1: backed by the Northwind demo dataset (./demo). Wiring to Supabase swaps the
 * implementation module; signatures and the view models in ./types stay the same.
 */
export * from "./demo";
export type * from "./types";
