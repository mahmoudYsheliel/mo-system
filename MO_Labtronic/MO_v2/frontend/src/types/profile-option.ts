import type { Component } from "vue";

export interface ProfileOption {
  label: string;
  iconComp: Component;
  userCommand: Function;
  fill: string;
}
