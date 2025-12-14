<script lang="ts" setup>
import Notes from "@/components/manufacturing-order-info/Notes.vue";
import NavigationBar from "@/components/general/NavigationBar.vue";
import MODates from "@/components/manufacturing-order-info/MODates.vue";
import BreadCrumbNavigator from "@/components/general/BreadCrumbNavigator.vue";
import Chip from "@/components/general/Chip.vue";
import MOParts from "@/components/manufacturing-order-info/MOParts.vue";
import MOFiles from "@/components/manufacturing-order-info/MOFiles.vue";
import {
  MOTypeColors,
  priorityColor,
  MOStatusColors,
  MORepresentativeColors,
} from "@/constants/colors";

import type {
  MODate,
  Priority,
  MOType,
  BasicInfo,
  MOSummaryStatus,
} from "@/types/mo-order";
import type { PartStatus } from "@/types/part";
import type { UserType } from "@/types/user";
import type { BreadCrumb } from "@/types/breadCrumb";
import type { FetchedNote } from "@/types/note";
import type { MOFileStructure } from "@/types/moFile";

import { useApiHandler } from "@/services/apiService";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "@/stores/auth";

import useUsersNames from "@/stores/usersNames";

const userNamesStore = useUsersNames();
const users = ref<any[]>([]);

const auth = useAuth();
const route = useRoute();
const { response: MOViewResponse, apiHandle: MOViewApiHandle } =
  useApiHandler();

const breadCrumbData = ref<BreadCrumb[]>([]);
const basicInfo = ref<BasicInfo>({});
const engineers = ref<Partial<Record<UserType, string>>>({});
const MODatesObj = ref<MODate>({});
const notes = ref<FetchedNote[]>([]);
const moName = ref("");
const projectName = ref("");
const filesStatus = ref<MOFileStructure[]>([]);
const MOId = ref<string>("");

const { apiHandle: updateMOSeenAPIHandle } = useApiHandler();

onMounted(() => {
  MOViewApiHandle(
    "/api/collections/MO_View/records",
    "GET",
    true,
    `?filter=(id='${route.params.id}')`
  );
});

watch([MOViewResponse], async () => {
  const data = MOViewResponse.value?.data?.items[0];
  if (!data) return;

  users.value = (await userNamesStore.getUsers()) || [];
  moName.value = data.MO_Name;
  MOId.value = data.id;
  projectName.value = data.Project_Name;
  breadCrumbData.value?.push({ name: data.University_Name, command: () => {} });
  breadCrumbData.value?.push({ name: data.Project_Name, command: () => {} });
  breadCrumbData.value?.push({ name: data.Lab_Name, command: () => {} });
  breadCrumbData.value?.push({ name: data.MO_Name, command: () => {} });

  basicInfo.value.priority = data.Periority as Priority;
  basicInfo.value.status = data.MO_Status as MOSummaryStatus;
  basicInfo.value.type = data.MO_Type as MOType;

  engineers.value.DesignEngineer = data?.Design_Engineer;
  engineers.value.ProductionEngineer = data?.Production_Engineer;
  engineers.value.ProjectManager = data?.Project_Manager;

  MODatesObj.value.start = data?.MO_Date;
  MODatesObj.value.estimated = data?.Est_Deadline;
  MODatesObj.value.finish = data?.Fin_Deadline;
  notes.value = data?.Notes;

  let seen = data?.Seen as any[];
  if (!seen.includes(auth.user.id)) {
    seen.push(auth.user.id);
    updateMOSeenAPIHandle(
      `/api/collections/MO_T/records/${route.params.id}`,
      "PATCH",
      true,
      undefined,
      { Seen: JSON.stringify(seen) }
    );
  }

  const fs = data?.Files_Status as string;
  filesStatus.value = organizeData(fs);
});

function organizeData(data: string): MOFileStructure[] {
  // this is a temporary function untill database get cleaner
  const objectStrings = data.split("{"); // this is each object assuming no data contains '{'
  const objects: MOFileStructure[] = objectStrings
    .map((os) => {
      const fields = os
        .replace(/[{}\[\]]/g, "")
        .trim()
        .split(",");
      if (fields.length > 3) {
        return {
          fileName: fields[0] || "",
          isSent:
            fields[1] && (fields[1].includes("t") || fields[1].includes("T"))
              ? true
              : false,
          senderName:
            (users.value.find((u) => {
              return u.id == fields[2];
            })?.id as string) || "",
          sentDate: fields[3] || "",
        };
      }
      return null;
    })
    .filter((o) => o !== null);
  return objects;
}
</script>

<template>
  <div id="mo-info-container">
    <NavigationBar :pageName="moName" />
    <div id="mo-info-main-body">
      <BreadCrumbNavigator
        :breadCrumbElements="breadCrumbData"
        style="margin-top: 1rem"
      />
      <div class="chip-line-constainer">
        <Chip
          :bg="MOTypeColors[basicInfo.type as MOType]"
          :label="basicInfo.type"
        />
        <Chip
          :bg="priorityColor[basicInfo.priority as Priority]"
          :label="basicInfo.priority"
        />
        <Chip
          :bg="MOStatusColors[basicInfo.status as PartStatus]"
          :label="basicInfo.status"
        />
        <Chip
          v-for="(engineer, engType) in engineers"
          :bg="MORepresentativeColors[engType as UserType]"
          :label="engineer"
        />
      </div>

      <MODates
        :start="MODatesObj.start"
        :estemated="MODatesObj.estimated"
        :finished="MODatesObj.finish"
        id="mo-dates"
      />
      <div class="mo-info-section-container">
        <Notes :fetchedNotes="notes" />
      </div>
      <div class="mo-info-section-container" v-show="filesStatus.length">
        <MOFiles
          :projectName="projectName"
          :MOName="moName"
          :MOId="MOId"
          :users="users"
          :files="filesStatus"
        />
      </div>
      <div class="mo-info-section-container">
        <MOParts :MOId="MOId" />
      </div>
    </div>
  </div>
</template>

<style scoped>
#mo-info-container {
  display: grid;
  max-height: 100vh;
  grid-template-rows: max-content 1fr;
}

#mo-info-main-body {
  padding-inline: 2rem;
  max-height: 100%;
  overflow-y: auto;
}

.chip-line-constainer {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  max-width: 100%;
  overflow-x: auto;
  padding: 0 1rem 0.5rem 1rem;
  scrollbar-width: thin;
  scrollbar-color: #aaa transparent;
  scrollbar-track-color: none;
}

#mo-dates {
  margin-block: 0.5rem;
}
.mo-info-section-container {
  margin-block: 1rem;
}
</style>
