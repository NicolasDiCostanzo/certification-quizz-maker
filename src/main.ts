import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import { awsConfig } from './config'
import { router } from './router'
import { configureAuth } from './services/auth'
import './style.css'

async function bootstrap() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  const { userPoolId, userPoolClientId } = awsConfig
  if (userPoolId && userPoolClientId) {
    await configureAuth(userPoolId, userPoolClientId)
  }

  createApp(App).use(pinia).use(router).mount('#app')
}

void bootstrap()
