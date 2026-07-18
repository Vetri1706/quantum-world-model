import type { Component } from "../models/Component.js";

export interface RuntimeComponent extends Omit<Component, "compatible_with"> {
  compatible_with: RuntimeComponent[];
}
