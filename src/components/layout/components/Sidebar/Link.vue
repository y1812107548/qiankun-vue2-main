<template>
  <component :is="type" v-bind="linkProps()">
    <slot />
  </component>
</template>

<script>
  import { RegexUtil } from '@/utils/validate'

  export default {
    props: {
      to: {
        type: String,
        required: true
      },
      meta: {
        type: Object,
        default: () => {}
      }
    },
    computed: {
      isExternal() {
        if (this.meta) {
          return (this.meta.isWin && !this.meta.isSSO) && RegexUtil.url.test(this.meta.iframeUrl)
        }
        return false
      },
      type() {
        if (this.isExternal) {
          return 'a'
        }
        return 'router-link'
      }
    },
    methods: {
      linkProps() {
        if (this.isExternal) {
          return {
            href: this.meta.iframeUrl,
            target: '_blank',
            rel: 'noopener'
          }
        }
        return {
          to: this.to
        }
      }
    }
  }
</script>
