import { createRequire } from 'node:module'

import type corsType from 'cors'

const require = createRequire(import.meta.url)

export default require('cors') as typeof corsType
