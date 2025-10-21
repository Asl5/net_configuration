import {
  // Core / Sistema
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  WrenchIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  LockClosedIcon,
  LockOpenIcon,
  KeyIcon,
  ServerStackIcon,
  GlobeAltIcon,
  CpuChipIcon,
  BoltIcon,

  // Utenti
  UserIcon,
  UsersIcon,
  UserCircleIcon,
  IdentificationIcon,

  // Messaggi / Comunicazioni
  EnvelopeIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  BellAlertIcon,
  BellIcon,

  // Dashboard / Statistiche
  ChartPieIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PresentationChartLineIcon,
  PresentationChartBarIcon,
  Squares2X2Icon,

  // File / Documenti / Storage
  DocumentDuplicateIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  FolderArrowDownIcon,
  FolderOpenIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  InboxArrowDownIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,

  // Azioni / Flussi
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  ArrowsUpDownIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  CheckCircleIcon,
  XCircleIcon,

  // Tempo / Agenda
  CalendarIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  AdjustmentsVerticalIcon,

  // Avvisi / Stato
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  CheckBadgeIcon,

  // Varie / UI
  HomeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
  PencilSquareIcon,
  Bars3Icon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/vue/24/solid";

/**
 * Mappa logica → componente icona Heroicons
 */
export const iconMap: Record<string, any> = {
  // ⚙️ Sistema
  settings: Cog6ToothIcon,
  tools: WrenchScrewdriverIcon,
  wrench: WrenchIcon,
  server: ServerStackIcon,
  globe: GlobeAltIcon,
  cpu: CpuChipIcon,
  power: BoltIcon,
  security: ShieldCheckIcon,
  warning: ShieldExclamationIcon,
  lock: LockClosedIcon,
  unlock: LockOpenIcon,
  key: KeyIcon,

  // 👤 Utenti
  user: UserIcon,
  users: UsersIcon,
  profile: UserCircleIcon,
  id: IdentificationIcon,

  // ✉️ Comunicazioni
  mail: EnvelopeIcon,
  send: PaperAirplaneIcon,
  chat: ChatBubbleLeftRightIcon,
  notification: BellIcon,
  alert: BellAlertIcon,

  // 📊 Dashboard / Statistiche
  dashboard: ChartPieIcon,
  stats: ChartBarIcon,
  trends: PresentationChartLineIcon,
  bars: ChartBarSquareIcon,
  summary: PresentationChartBarIcon,
  trendUp: ArrowTrendingUpIcon,
  trendDown: ArrowTrendingDownIcon,
  grid: Squares2X2Icon,

  // 📄 Documenti / File
  document: DocumentDuplicateIcon,
  text: DocumentTextIcon,
  report: ClipboardDocumentListIcon,
  download: DocumentArrowDownIcon,
  upload: DocumentArrowUpIcon,
  folder: FolderOpenIcon,
  folderDownload: FolderArrowDownIcon,
  archive: ArchiveBoxIcon,
  inbox: InboxArrowDownIcon,
  cloudUp: CloudArrowUpIcon,
  cloudDown: CloudArrowDownIcon,

  // 🔄 Azioni / Flussi
  flow: ArrowPathIcon,
  exchange: ArrowsRightLeftIcon,
  reorder: ArrowsUpDownIcon,
  start: PlayIcon,
  stop: StopIcon,
  pause: PauseIcon,
  add: PlusCircleIcon,
  remove: MinusCircleIcon,
  confirm: CheckCircleIcon,
  cancel: XCircleIcon,

  // 🕒 Tempo / Config
  calendar: CalendarIcon,
  time: ClockIcon,
  filters: AdjustmentsHorizontalIcon,
  sliders: AdjustmentsVerticalIcon,

  // ⚠️ Avvisi / Stato
  error: ExclamationTriangleIcon,
  danger: ExclamationCircleIcon,
  info: InformationCircleIcon,
  help: QuestionMarkCircleIcon,
  success: CheckBadgeIcon,

  // 🏠 UI / Navigazione
  home: HomeIcon,
  search: MagnifyingGlassIcon,
  view: EyeIcon,
  hide: EyeSlashIcon,
  favorite: StarIcon,
  tag: TagIcon,
  trash: TrashIcon,
  edit: PencilSquareIcon,
  menu: Bars3Icon,
  heart: HeartIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  logout: ArrowRightStartOnRectangleIcon,
};
