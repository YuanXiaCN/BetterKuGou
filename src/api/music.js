// 音乐相关 API
import axios from 'axios'

// API 基础地址
const API_BASE_URL = 'http://localhost:6500'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 只为部分 API 添加 token 和 userid 参数
    // 对于需要完整认证的 API（如 getSongUrl），会在函数内部单独处理
    const token = localStorage.getItem('kugou_token')
    const userid = localStorage.getItem('kugou_userid')
    
    if (token && !config.params?.cookie) {
      // 只有在没有明确指定 cookie 的情况下才添加这些参数
      if (!config.params) {
        config.params = {}
      }
      config.params.token = token
      if (userid) {
        config.params.userid = userid
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

/**
 * 获取私人 FM（猜你喜欢）
 * @returns {Promise}
 */
export const getPersonalFM = () => {
  return apiClient.get('/personal/fm')
}

/**
 * 获取每日推荐歌曲
 * @returns {Promise}
 */
export const getEverydayRecommend = () => {
  return apiClient.get('/everyday/recommend')
}

/**
 * 获取排行榜列表
 * @returns {Promise}
 */
export const getRankList = () => {
  return apiClient.get('/rank/list')
}

/**
 * 获取排行榜详情
 * @param {number} rankid - 排行榜 ID
 * @param {number} page - 页码
 * @param {number} pagesize - 每页数量
 * @returns {Promise}
 */
export const getRankInfo = (rankid, page = 1, pagesize = 30) => {
  return apiClient.get('/rank/info', {
    params: { rankid, page, pagesize }
  })
}

/**
 * 获取 AI 推荐
 * @param {string} audio_id - 歌曲 ID，多个用逗号分隔
 * @returns {Promise}
 */
export const getAIRecommend = (audio_id) => {
  return apiClient.get('/ai/recommend', {
    params: { audio_id }
  })
}

/**
 * 获取歌曲详情
 * @param {string} hash - 歌曲 hash
 * @returns {Promise}
 */
export const getSongDetail = (hash) => {
  return apiClient.get('/audio', {
    params: { hash }
  })
}

/**
 * 获取歌曲播放地址（旧版，返回未加密的播放地址）
 * @param {string} hash - 歌曲 hash
 * @param {number} album_id - 专辑 ID
 * @param {number} album_audio_id - 专辑音频 ID
 * @returns {Promise}
 */
export const getSongUrl = (hash, album_id = 0, album_audio_id = 0) => {
  // 获取认证信息
  const token = localStorage.getItem('kugou_token') || ''
  const userid = localStorage.getItem('kugou_userid') || '0'
  
  // 构建请求 URL，参考 BetterKugou 的实现方式
  let url = '/song/url'
  const params = new URLSearchParams({
    hash,
    album_id: album_id.toString(),
    album_audio_id: album_audio_id.toString(),
    quality: '128'
  })
  
  // 如果已登录，添加 cookie 参数（参考 BetterKugou 的方式）
  if (token && userid) {
    const cookieParam = `token=${encodeURIComponent(token)};userid=${encodeURIComponent(userid)}`
    params.append('cookie', cookieParam)
  }
  
  url += '?' + params.toString()
  
  // 使用 axios 直接请求
  return apiClient.get(url)
}

/**
 * 搜索歌词信息
 * @param {string} hash - 歌曲 hash
 * @param {number} album_audio_id - 专辑音频 ID (可选)
 * @param {string} keywords - 搜索关键词 (可选)
 * @returns {Promise}
 */
export const searchLyric = (hash, album_audio_id = 0, keywords = '') => {
  return apiClient.get('/search/lyric', {
    params: {
      hash,
      album_audio_id,
      keywords
    }
  })
}

/**
 * 获取歌词详情
 * @param {string} id - 歌词 ID
 * @param {string} accesskey - 访问密钥
 * @returns {Promise}
 */
export const getLyricDetail = (id, accesskey) => {
  return apiClient.get('/lyric', {
    params: {
      id,
      accesskey,
      fmt: 'krc',  // 使用krc格式获取逐字歌词
      charset: 'utf8',
      ver: 1,
      client: 'pc',
      decode: true  // 请求服务器自动解码歌词内容
    }
  })
}

/**
 * 获取歌词（完整流程：先搜索然后获取详情）
 * @param {string} hash - 歌曲 hash
 * @param {number} album_audio_id - 专辑音频 ID (可选)
 * @param {string} keywords - 搜索关键词 (可选，默认为空)
 * @returns {Promise}
 */
export const getLyric = async (hash, album_audio_id = 0, keywords = '') => {
  try {
    // 第一步：搜索歌词信息
    const searchResult = await searchLyric(hash, album_audio_id, keywords)
    
    console.log('搜索歌词响应:', searchResult) // 调试日志
    
    if (!searchResult || !searchResult.candidates || searchResult.candidates.length === 0) {
      throw new Error('未找到歌词信息')
    }
    
    // 取第一个候选歌词
    const lyricInfo = searchResult.candidates[0]
    const lyricId = lyricInfo.id
    const accesskey = lyricInfo.accesskey
    
    if (!lyricId || !accesskey) {
      throw new Error('歌词ID或访问密钥无效')
    }
    
    // 第二步：获取歌词详情
    const lyricDetail = await getLyricDetail(lyricId, accesskey)
    
    return lyricDetail
  } catch (error) {
    console.error('获取歌词失败:', error)
    throw error
  }
}

/**
 * 获取用户歌单列表
 * @param {number} page - 页码
 * @param {number} pagesize - 每页数量
 * @returns {Promise}
 */
export const getUserPlaylists = (page = 1, pagesize = 30) => {
  return apiClient.get('/user/playlist', {
    params: { page, pagesize }
  })
}

/**
 * 获取歌单所有歌曲
 * @param {string} id - 歌单 ID
 * @param {number} page - 页码
 * @param {number} pagesize - 每页数量
 * @returns {Promise}
 */
export const getPlaylistTracks = (id, page = 1, pagesize = 100) => {
  return apiClient.get('/playlist/track/all', {
    params: { id, page, pagesize }
  })
}
