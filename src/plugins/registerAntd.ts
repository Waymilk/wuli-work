import type { App } from 'vue'
import {
  Avatar,
  Button,
  Carousel,
  Checkbox,
  ConfigProvider,
  Dropdown,
  Empty,
  Input,
  Layout,
  Menu,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Space,
  Spin,
  Tabs,
  Tooltip,
  RangePicker,
  Form,
  Upload,
} from 'ant-design-vue'

type ComponentLike = unknown

const register = (app: App, name: string, component: ComponentLike | undefined) => {
  if (!component) return
  app.component(name, component as never)
}

export const registerAntd = (app: App) => {
  register(app, 'AConfigProvider', ConfigProvider)

  register(app, 'ALayout', Layout)
  register(app, 'ALayoutSider', Layout.Sider)
  register(app, 'ALayoutContent', Layout.Content)

  register(app, 'ATabs', Tabs)
  register(app, 'ATabPane', Tabs.TabPane)

  register(app, 'APopover', Popover)
  register(app, 'APopconfirm', Popconfirm)
  register(app, 'ATooltip', Tooltip)
  register(app, 'ADropdown', Dropdown)
  register(app, 'AMenu', Menu)
  register(app, 'AMenuItem', Menu.Item)
  register(app, 'ASubMenu', Menu.SubMenu)

  register(app, 'ASelect', Select)
  register(app, 'ASelectOption', Select.Option)

  register(app, 'AButton', Button)
  register(app, 'ACheckbox', Checkbox)
  register(app, 'ASpace', Space)
  register(app, 'ACarousel', Carousel)
  register(app, 'AInput', Input)
  register(app, 'ATextarea', Input.TextArea)
  register(app, 'AModal', Modal)
  register(app, 'ASpin', Spin)
  register(app, 'AAvatar', Avatar)
  register(app, 'AEmpty', Empty)
  register(app, 'ARangePicker', RangePicker)
  register(app, 'AForm', Form)
  register(app, 'AFormItem', Form.Item)
  register(app, 'AUpload', Upload)

}
