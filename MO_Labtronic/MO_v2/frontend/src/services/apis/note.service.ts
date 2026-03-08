import type { ReturnMessage } from "@/models/return-message.model";
import { ApiService } from "../api.service";
import { type NoteModel } from "@/models/note.model";

const noteEndPoint = "/api/collections/notes/records";
export async function deleteNote(noteId: string) {
  try {
    const noteRes = await ApiService.delete(`${noteEndPoint}/${noteId}`);
    return noteRes;
  } catch (error) {
    console.error("Failed to delete note: ", error);
    throw error;
  }
}

export async function updateNote(
  noteId: string,
  note: NoteModel,
): Promise<ReturnMessage<NoteModel>> {
  try {
    const noteRes = await ApiService.patch<NoteModel>(
      `${noteEndPoint}/${noteId}`,
      note,
    );
    return noteRes;
  } catch (error) {
    console.error("Failed to update note: ", error);
    throw error;
  }
}

export async function addNote(
  note: NoteModel,
): Promise<ReturnMessage<NoteModel>> {
  try {
    const noteRes = await ApiService.post<NoteModel>(`${noteEndPoint}`, note);
    return noteRes;
  } catch (error) {
    console.error("Failed to add note: ", error);
    throw error;
  }
}
