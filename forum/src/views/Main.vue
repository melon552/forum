<template>
  <div class="layout">
    <el-container>
      <el-header>
        <Header />
      </el-header>
      <el-container > 
        <el-aside width="200px">
          <Aside />
        </el-aside>
        <el-main>
          <router-view/>
        </el-main>
      </el-container>
     
      
    </el-container>
  </div>
  
  
  
</template>
<script setup>
import Header from '../components/NavHeader.vue'
import Aside from '../components/Aside.vue'
</script>
<style scoped lang="less">
layout {
  height: 100vh;
  margin: 0;
  padding: 0;
}
.el-container {
  height: 100%;
}

.el-aside {
  background-color: #fff;
  height: calc(100vh - 60px); /* 减去Header高度（假设Header高40px + 上下各10px padding） */
  border-right: 1px solid #eee;
  padding-top: 10px; /* 与Header拉开10px距离 */
}
.el-main {
  padding: 10px 20px; /* 与Header和侧边栏拉开10px距离 */
  overflow: auto;
}
</style>