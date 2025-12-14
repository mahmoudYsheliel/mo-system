import type { ProcessStatus } from "@/types/process";

export function getPartProcessObject(part: any) {
  const processes: Record<string, ProcessStatus> = {};
  if (part.Process1) processes[part.Process1] = part.Process1_Status;
  if (part.Process2) processes[part.Process2] = part.Process2_Status;
  if (part.Process3) processes[part.Process3] = part.Process3_Status;
  if (part.Process4) processes[part.Process4] = part.Process4_Status;
  if (part.Process5) processes[part.Process5] = part.Process5_Status;
  return processes;
}

export function getPartProcessDBShema(
  part: any,
  processes: Record<string, ProcessStatus>
) {
  const Process1 = part.Process1;
  const Process2 = part.Process2;
  const Process3 = part.Process3;
  const Process4 = part.Process4;
  const Process5 = part.Process5;
  return {
    Process1_Status: processes[Process1] || '',
    Process2_Status: processes[Process2] || '',
    Process3_Status: processes[Process3] || '',
    Process4_Status: processes[Process4] || '',
    Process5_Status: processes[Process5] || '',
  };
}
