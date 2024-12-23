// 基础的后台脚本
console.log('Background script loaded');

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// 防止 TypeScript 报错
export {} 