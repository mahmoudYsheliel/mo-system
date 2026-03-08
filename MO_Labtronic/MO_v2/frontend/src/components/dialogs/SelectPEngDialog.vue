<script setup lang="ts">
import Select from 'primevue/select';
import { getUsers } from '@/services/apis/account.service';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Toast, useToast } from 'primevue';
import type { AccountModel } from '@/models/account.model';
import { setMoProdEng } from '@/services/apis/mo.service';

const toast = useToast()
const route = useRoute()
const visible = defineModel<boolean>('visible')
const selectedEng = ref()
const pEngs = ref<AccountModel[] | undefined>([])
onMounted(async () => {
    const usersRes = await getUsers()
    if (usersRes.success)
        pEngs.value = usersRes.data?.items?.filter(user => user.roles?.includes('Production Engineer'))
})

async function setPEng() {
    if (!selectedEng.value)
        return
    const moId = route.params.id
    const res = await setMoProdEng(moId as string, selectedEng.value.id)

    if (res.success) {
        toast.add({
            severity: 'success',
            summary: 'Updated Successfully',
            detail: 'Production engineer was updated successfully'
        })
    }
    else {
        toast.add({
            severity: 'error',
            summary: 'Failed to Update',
            detail: 'Production engineer could not be updated successfully'
        })
    }
    visible.value = false
}

</script>

<template>
    <Toast />
    <Dialog v-model:visible="visible" modal header="Select Production Engineer">
        <div class="select-eng-container">
            <Select v-model="selectedEng" :options="pEngs" optionLabel="userName" placeholder="Select an Engineer" />
            <Button @click="setPEng" label="Update Eng" style="width: 8rem;align-self: flex-end;" />
        </div>
    </Dialog>
</template>


<style scoped>
.select-eng-container {
    width: 20rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>