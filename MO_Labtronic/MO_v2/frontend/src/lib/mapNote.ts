import type { FetchedNote, Note } from "@/types/note";
import { getDateStringFromDateTime } from "./helperFunctions";
import { getDate,getTime } from "./helperFunctions";

export function mapFetchedNotestoNotes(
  fn: FetchedNote[] | undefined,
  users: any[] | undefined,
  userId: string
): Note[] {
  if (!fn || !users) return [];
  return fn.map((note) => {
    const date = new Date(note.created);
    return {
      sender: users.find((u) => u.id == note.user_id)?.Full_Name || "",
      date: getDate(date),
      time: getTime(date),
      content: note.content,
      noteClass:
        note.user_id == userId ? "note-first-user" : "note-second-user",
    };
  });
}

export function mapNotesToFetchedNoted(
  n: Note[] | undefined,
  users: any[]
): FetchedNote[] {
  if (!n || !users) return [];

  const notes = n.map((note) => {
    const d = getDateStringFromDateTime(note.date || "", note.time || "");
    return {
      content: note.content || "",
      user_id: users.find((u) => u.Full_Name == note.sender)?.id || "",
      created: d || "",
    };
  });
  return notes;
}
