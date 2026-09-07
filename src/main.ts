import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import { awsConfig } from './config'
import { router } from './router'
import { configureAuth } from './services/auth'
import { restoreAccountSession } from './services/sessionRestore'
import './style.css'

async function bootstrap() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  setActivePinia(pinia)

  const { userPoolId, userPoolClientId } = awsConfig
  if (userPoolId && userPoolClientId) {
    await configureAuth(userPoolId, userPoolClientId)
  }

  await restoreAccountSession()

  createApp(App).use(pinia).use(router).mount('#app')
}

void bootstrap()
