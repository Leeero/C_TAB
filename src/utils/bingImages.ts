export interface BingImage {
  url: string        // 原图URL
  thumbnailUrl: string  // 缩略图URL
  title: string
  copyright: string
}

// 获取 Bing 每日图片
export const getBingImages = async (): Promise<BingImage[]> => {
  try {
    const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8')
    const data = await response.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.images.map((image: any) => ({
      url: `https://www.bing.com${image.url}`,
      thumbnailUrl: `https://www.bing.com${image.url}&w=200&h=120`, // 添加缩略图
      title: image.title,
      copyright: image.copyright
    }))
  } catch (error) {
    console.error('获取 Bing 图片失败:', error)
    throw error
  }
} 