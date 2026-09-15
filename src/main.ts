import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import { awsConfig, setAuthRuntimeAvailable } from './config'
import { router } from './router'
import { configureAuth } from './services/auth'
import './style.css'

async function bootstrap() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  const { userPoolId, userPoolClientId } = awsConfig
  if (userPoolId && userPoolClientId) {
    const configured = await configureAuth(userPoolId, userPoolClientId)
    if (!configured) {
      console.warn('Auth configuration failed; falling back to local-only mode')
      setAuthRuntimeAvailable(false)
    }
  }

  createApp(App).use(pinia).use(router).mount('#app')
}

void bootstrap()
