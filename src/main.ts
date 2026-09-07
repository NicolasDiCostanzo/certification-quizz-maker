import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import { awsConfig } from './config'
import { router } from './router'
import './style.css'

async function bootstrap() {
  const { userPoolId, userPoolClientId } = awsConfig
  if (userPoolId && userPoolClientId) {
    const { Amplify } = await import('aws-amplify')
    Amplify.configure({ Auth: { Cognito: { userPoolId, userPoolClientId } } })
  }

  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  createApp(App).use(pinia).use(router).mount('#app')
}

void bootstrap()
