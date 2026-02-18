<script setup lang="ts">
import SideBar from '@/components/general/SideBar.vue';
import NavigationBar from '@/components/general/NavigationBar.vue';
import { onMounted, ref } from 'vue';
import { useAuth } from '@/stores/auth';
import { getFileLink } from '@/lib/helperFunctions';
import Button from 'primevue/button';
import Password from 'primevue/password';
import { apiHandle } from '@/services/apiService';
import { postEvent } from '@/utils/mediator';


const name = ref('')
const accountName = ref('')
const role = ref('')
const email = ref('')
const id = ref('')
const image = ref('')
const fileRef = ref<any>()


const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const auth = useAuth()
onMounted(() => {
    name.value = auth.user?.Full_Name || ""
    role.value = auth.user?.Role[0] || ""
    email.value = auth.user?.email
    accountName.value = auth.user?.Account_Name || ""
    id.value = auth.user?.id
    image.value = getAvatar()
})



function getAvatar() {
    const user = auth.user
    return getFileLink(user.collectionId, user.id, user.Avatar) || ""
}

const inputFielRef = ref<HTMLInputElement | null>(null)
function triggerSelect() {
    inputFielRef.value?.click()
}


async function upladImage(event: Event) {
    try {
        const target = event.target as HTMLInputElement
        if (!target.files || !(target.files?.length > 0)) return
        const file = target.files[0]
        if (!file) return

        fileRef.value = file
        image.value = URL.createObjectURL(file)

    }
    catch (err) {
        postEvent('add_toast', {
            severity: 'error',
            summary: 'Update Failed',
            detail: `Updating profile image failed: ${err}`
        })
    }
}
async function saveImage() {
    try {
        const formData = new FormData();
        formData.append('Avatar', fileRef.value);
        await apiHandle(
            `/api/collections/Accounts_T/records/${id.value}`, 'PATCH', true, undefined, formData, 'data', 'form_data', null
        );
        postEvent('add_toast', {
            severity: 'success',
            summary: 'Profile Updated',
            detail: 'New profile image was set successfully'
        })
        const userResponse = await apiHandle(`/api/collections/Accounts_T/records/${id.value}`, 'GET')
        auth.setUser(userResponse.data)
    }
    catch (err) {
        postEvent('add_toast', {
            severity: 'error',
            summary: 'Update Failed',
            detail: `Updating profile image failed: ${err}`
        })
    }
    finally {
        fileRef.value = null
        image.value = getAvatar()
    }
}

async function cancelSaveImage() {
    fileRef.value = null
    image.value = getAvatar()

}
async function updatePassword() {


    const body = {
        oldPassword: oldPassword.value,
        password: newPassword.value,
        passwordConfirm: confirmPassword.value,
    }
    const res = await apiHandle(`/api/collections/Accounts_T/records/${id.value}`, 'PATCH', true, undefined, body)
    if (res.success == true) {
        postEvent('add_toast', {
            severity: 'success',
            summary: 'Updated Password',
            detail: 'New password was set successfully'
        })
        auth.login(email.value,newPassword.value)
    }
    else {
        const oldPassError = res.data.data['oldPassword']
        const newPassError = res.data.data['password']
        const confirmPassError = res.data.data['passwordConfirm']
        
        const oldPassErrorMessage = oldPassError ? `\n Old Password: ${oldPassError.message}` : ''
        const newPassErrorMessage = newPassError ? ` \n New Password: ${newPassError.message}` : ''
        const confirmPassErrorMessage = confirmPassError ? ` \n Confirm Password: ${confirmPassError.message}` : ''

        postEvent('add_toast', {
            severity: 'error',
            summary: 'Update Failed',
            detail: `Updating password failed: ${oldPassErrorMessage} ${newPassErrorMessage} ${confirmPassErrorMessage} `
        })
    }
}



</script>

<template>
    <div id="user-profile-container">
        <SideBar />
        <div id="user-profile-main-container">
            <NavigationBar pageName="User Profile" />
            <div class="user-profile-information">
                <div class="user-profile-img-container">
                    <img :src="image" alt="" class="user-profile-img">
                    <div class="name-email-container">
                        <p> {{ accountName }} ({{ name }})</p>
                        <p style="opacity: 0.5;font-size: 0.875rem;"> {{ email }} </p>
                        <p style="opacity: 0.5;font-size: 0.875rem;font-weight: 600;"> {{ role }} </p>
                    </div>
                    <div style="flex-grow: 2;"></div>
                    <Button v-if="!fileRef" label="Edit Profile Image" style="font-size: 0.875rem;" @click="triggerSelect()" />
                    <div v-else style="display: flex; gap: 0.5rem">
                        <Button label="Save" severity="success" style="font-size: 0.875rem;" @click="saveImage()" />
                        <Button label="Cancel" severity="danger" style="font-size: 0.875rem;" @click="cancelSaveImage()" />
                    </div>

                    <input type="file" ref="inputFielRef" accept="image/*" @change="upladImage" style="display: none;" />
                </div>

                <div class="password-reset-container">
                    <p style="align-self: flex-start;font-weight: 500;">Reset Password</p>
                    <Password v-model="oldPassword" style="width: 24rem;padding-left: 0.5rem;" placeholder="Old Password" toggleMask :feedback="false" />
                    <Password v-model="newPassword" style="width: 24rem;padding-left: 0.5rem;" placeholder="New Password" toggleMask :feedback="false" />
                    <Password v-model="confirmPassword" style="width: 24rem;padding-left: 0.5rem;" placeholder="Confirm Password" toggleMask :feedback="false" />
                    <Button label="Reset Password" style="align-self: flex-end; padding-inline: 2rem;font-size: 0.875rem;" @click="updatePassword()" />
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
#user-profile-container {
    display: grid;
    grid-template-columns: max-content auto;
}

#user-profile-main-container {
    padding-inline: 2rem;
    max-height: 100vh;
    overflow: auto;
}

.user-profile-information {
    margin-inline: auto;
    margin-top: 1rem;
    border-radius: 1rem;
    max-width: 36rem;
    padding: 1rem;
    padding-bottom: 4rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    background-color: white;
}

.user-profile-img-container {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
}

.name-email-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.user-profile-img {
    height: 8rem;
    aspect-ratio: 1/1;
    border-radius: 50%;
}

.user-profile-info-container {
    display: flex;
    height: 6rem;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    font-size: 1.25rem;
}

.user-profile-info {
    display: flex;
    gap: 0.5rem;
}

.info-name {
    color: #6a6a6a;
    font-weight: 600;
    width: 12ch;
}

.info-value {
    color: #2c2c2c;
}

.password-reset-container {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-inline: 0.5rem;
}

@media screen and (max-width:1200px) {
    .user-profile-information {
        flex-direction: column;
    }
}
</style>