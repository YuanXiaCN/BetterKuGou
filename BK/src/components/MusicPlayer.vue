export default {
  name: 'MusicPlayer',
  // ... other properties ...
  methods: {
    playNext() {
      console.log('🎵 [MusicPlayer] 开始切歌（下一曲），已加锁')
      
      // 确保播放列表存在且有歌曲
      if (!this.playlist || this.playlist.length === 0) {
        console.warn('🎵 [MusicPlayer] 播放列表为空，无法播放下一曲')
        return
      }
      
      // 获取当前播放索引
      const currentIndex = this.currentIndex
      
      // 计算下一首歌曲的索引
      let nextIndex = currentIndex + 1
      
      // 如果是循环播放模式，处理循环逻辑
      if (this.loopMode === 'loop') {
        nextIndex = nextIndex % this.playlist.length
      } else if (this.loopMode === 'single') {
        // 单曲循环模式，保持当前歌曲
        nextIndex = currentIndex
      } else if (this.loopMode === 'random') {
        // 随机播放模式，生成随机索引
        nextIndex = Math.floor(Math.random() * this.playlist.length)
        
        // 确保不重复播放当前歌曲
        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * this.playlist.length)
        }
        
        console.log('🎵 [MusicPlayer] 未生成随机列表，随机选择:', nextIndex)
      }
      
      // 确保索引有效
      if (nextIndex < 0 || nextIndex >= this.playlist.length) {
        console.warn('🎵 [MusicPlayer] 无效的下一曲索引:', nextIndex)
        return
      }
      
      // 获取下一首歌曲
      const nextSong = this.playlist[nextIndex]
      
      // 输出详细信息
      console.log('🎵 [MusicPlayer] 尝试播放下一曲 (%d/%d): %s - %s 索引: %d', 
        nextIndex + 1, this.playlist.length, 
        nextSong.singername || nextSong.author_name || nextSong.name.split(' - ')[0], 
        nextSong.name.split(' - ')[1] || nextSong.name, 
        nextIndex)
      
      // 设置新的当前歌曲
      this.setCurrentSong(nextSong, nextIndex)
    },
    
    setCurrentSong(song, index) {
      console.log('🎵 [MusicPlayer] 设置当前歌曲:', song.name)
      
      // 更新当前歌曲和索引
      this.currentSong = song
      this.currentIndex = index
      
      // 加载歌曲
      this.loadSong(song)
    },
    
    loadSong(song) {
      console.log('🎵 [MusicPlayer] 开始加载歌曲:', song.hash)
      
      // 获取歌曲详情
      this.getSongDetails(song)
    },
    
    getSongDetails(song) {
      console.log('🎵 [MusicPlayer] 获取歌曲详情...')
      
      // 调用API获取歌曲详情
      // 假设这是异步操作
      setTimeout(() => {
        console.log('🎵 [MusicPlayer] 歌曲详情响应: {status: 1, error_code: 0, errmsg: "", data: Array(1)}')
        
        // 合并歌曲信息
        const mergedSongInfo = {
          ...song,
          mvdata: song.mvdata || [],
          hash: song.hash,
          brief: song.brief || '',
          audio_id: song.audio_id,
          mvtype: song.mvtype,
          singerinfo: song.singerinfo || [],
          singername: song.singername || undefined,
          author_name: song.author_name || undefined,
          filename: song.filename || undefined
        }
        
        console.log('🎵 [MusicPlayer] 合并后的歌曲信息:', mergedSongInfo)
        
        // 检查歌手信息字段
        console.log('🎵 [MusicPlayer] 歌手信息字段检查:', {
          singerinfo: song.singerinfo,
          singername: song.singername,
          author_name: song.author_name,
          singer_name: song.singer_name,
          filename: song.filename
        })
        
        // 获取播放URL
        this.getPlayUrl(song)
      }, 100)
    },
    
    getPlayUrl(song) {
      console.log('🎵 [MusicPlayer] 播放地址响应状态: 1')
      
      // 假设这是异步操作
      setTimeout(() => {
        const playUrl = 'http://fsandroid.kugou.com/202510092207/9a9b886d5ce066d45bb5cee84aff566b/v3/bf40049ed80ff9b5da54f5768bac1b03/yp/full/ap1005_us1881269306_mi336d5ebc5436534e61d16e63ddfca327_pi2_mx0_qu128_s441815028.mp3'
        
        console.log('🎵 [MusicPlayer] 获取播放URL:', playUrl)
        
        // 转换为HTTPS
        const httpsUrl = playUrl.replace('http://', 'https://')
        console.log('🎵 [MusicPlayer] 转换为HTTPS')
        
        // 设置音频源
        this.setAudioSource(httpsUrl)
      }, 100)
    },
    
    setAudioSource(url) {
      console.log('🎵 [MusicPlayer] 🎵 设置音频源')
      
      // 假设这是异步操作
      setTimeout(() => {
        console.log('🎵 [MusicPlayer] 播放成功')
        
        // 更新元数据
        this.updateMetadata()
      }, 100)
    },
    
    updateMetadata() {
      console.log('🎵 [MusicPlayer] 🎤 歌手信息调试:', {
        song: {
          singerinfo: this.currentSong.singerinfo,
          singerinfo[0]: this.currentSong.singerinfo[0],
          singerinfo详细内容: JSON.stringify(this.currentSong.singerinfo),
          singername: this.currentSong.singername,
          author_name: this.currentSong.author_name,
          filename: this.currentSong.filename
        }
      })
      
      // 更新封面图片
      console.log('🎵 [MusicPlayer] 🖼️ 封面图片调试信息:', {
        song: {
          img: this.currentSong.img,
          album_cover: this.currentSong.album_cover,
          cover: this.currentSong.cover,
          imageUrl: this.currentSong.imageUrl,
          pic: this.currentSong.pic
        }
      })
      
      // 替换封面URL占位符
      if (this.currentSong.cover && this.currentSong.cover.includes('{size}')) {
        const highResCover = this.currentSong.cover.replace('{size}', '1000')
        console.log('🎵 [MusicPlayer] 🔧 替换封面URL占位符（高清）:', highResCover)
        
        // 将封面 URL 转换为 HTTPS
        const httpsCover = highResCover.replace('http://', 'https://')
        console.log('🎵 [MusicPlayer] 将封面 URL 转换为 HTTPS:', httpsCover)
        
        // 更新封面图片
        this.currentSong.cover = httpsCover
      }
      
      // 更新元数据
      const metadata = {
        title: this.currentSong.name || '未知歌曲',
        artist: this.currentSong.singername || this.currentSong.author_name || '未知艺术家',
        album: this.currentSong.albuminfo?.name || '',
        artwork: this.currentSong.cover || ''
      }
      
      console.log('🎵 [MusicPlayer] 元数据已更新:', metadata)
      
      // 触发元数据更新事件
      this.$emit('metadata-updated', metadata)
    }
  }
}