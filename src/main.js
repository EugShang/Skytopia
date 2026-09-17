import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
const projectTitle = 'SKYTOPIA: Monocular Drone Navigation with Action-Conditioned Latent World Models'
const projectDescription = 'SKYTOPIA learns action-grounded visual geometry for monocular drone navigation through forward latent prediction and inverse command recovery in 3D Gaussian Splatting environments.'
document.title = projectTitle
document.querySelector('meta[name="description"]')?.setAttribute('content', projectDescription)
const app = createApp(App)

app.use(ElementPlus)
app.mount('#app')
