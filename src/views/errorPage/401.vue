<template>
  <div class="errPage-container">
   <h1>401</h1>
    <!-- <el-button icon="arrow-left" class="pan-back-btn" @click="back">{{ $t('@62C86:返回') }}</el-button>
    <el-row>
      <el-col :span="12">
        <h1 class="text-jumbo text-ginormous">Oops!</h1>
        <h2>{{ $t('@62C86:你没有权限去该页面') }}</h2>
        <ul class="list-unstyled">
          <li>{{ $t('@62C86:或者你可以去:') }}</li>
          <li>{{ $t('@62C86:请联系管理员获得页面权限') }}</li>
          <li class="link-type">
            <router-link to="/home-page">{{ $t('@62C86:回首页') }}</router-link>
          </li>
        </ul>
      </el-col>
      <el-col :span="12">
        <img :src="errGif" width="313" height="428" alt="Girl has dropped her ice cream.">
      </el-col>
    </el-row> -->
  </div>
</template>

<script>
  // import errGif from '@/assets/401_images/401.gif'
  export default {
    name: 'Page401',
    data() {
      return {
        // errGif: errGif + '?' + +new Date()
      }
    },
    methods: {
      back() {
        if (this.$route.query.noGoBack) {
          this.$router.push({ path: '/home-page' })
        } else {
          this.$router.go(-1)
        }
      }
    }
  }
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  .errPage-container {
    width: 800px;
    margin: 100px auto;

    .pan-back-btn {
      background: #008489;
      color: #fff;
      border: none !important;
    }

    .pan-gif {
      margin: 0 auto;
      display: block;
    }

    .pan-img {
      display: block;
      margin: 0 auto;
      width: 100%;
    }

    .text-jumbo {
      font-size: 60px;
      font-weight: 700;
      color: #484848;
    }

    .list-unstyled {
      font-size: 14px;

      li {
        padding-bottom: 5px;
      }

      a {
        color: #008489;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
</style>
