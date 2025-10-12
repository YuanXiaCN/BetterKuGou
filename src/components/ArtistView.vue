<template>
  <div class="artist-view" v-if="artist">
    <!-- 头部信息 -->
    <div class="artist-header">
      <img v-if="artist.avatar || artist.pic" :src="getAvatar(artist)" class="avatar" alt="avatar" />
      <div class="meta">
        <h1 class="name">{{ artist.author_name || artist.name }}</h1>
        <div class="stats">
          <span v-if="artist.fans_cnt">粉丝 {{ formatNumber(artist.fans_cnt) }}</span>
        </div>
        <div class="actions">
          <button class="primary-btn" :class="{ outline: followed }" @click="toggleFollow">
            {{ followed ? '已关注' : '关注' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{active: activeTab==='hot'}" @click="activeTab='hot'">热门歌曲</button>
      <button :class="{active: activeTab==='songs'}" @click="activeTab='songs'">单曲</button>
      <button :class="{active: activeTab==='albums'}" @click="activeTab='albums'">专辑</button>
      <button :class="{active: activeTab==='about'}" @click="activeTab='about'">资料</button>
    </div>

    <!-- 热门歌曲（10 首） -->
    <div v-if="activeTab==='hot'" class="song-list">
      <div class="list-header">
        <div class="col-index">#</div>
        <div class="col-title">歌曲</div>
        <div class="col-artist">歌手</div>
        <div class="col-album">专辑</div>
        <div class="col-duration">时长</div>
      </div>
      <div v-for="(song, idx) in hotSongs" :key="song.hash || idx" class="song-item" @dblclick="play(song)">
        <div class="col-index">
          <span class="index-number">{{ idx + 1 }}</span>
        </div>
        <div class="col-title">
          <img 
            v-if="song.cover" 
            :src="song.cover.replace('{size}','400')" 
            class="song-cover" 
            :alt="song.name"
            @load="onSongCoverLoad(song, $event)"
            @error="onSongCoverError(song, $event)" 
          />
          <div v-else class="song-cover-placeholder">
            <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor" opacity="0.3">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zM288 421a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0zm224 272c-85.5 0-155.6-67.3-160-151.6a8 8 0 018-8.4h48c4.4 0 8.2 3.6 8 8-1.8 33.2 26.8 61 58 61s59.8-27.8 58-61c-.2-4.4 3.6-8 8-8h48a8 8 0 018 8.4C667.6 625.7 597.5 693 512 693zm176-272a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0z"/>
            </svg>
          </div>
          <div class="song-info">
            <div class="song-name">
              {{ getSongName(song.name) }}
              <span v-if="song.relate_goods && song.relate_goods.some(g => g.level >= 5)" class="quality-badge">SQ</span>
            </div>
          </div>
        </div>
        <div class="col-artist">
          <span class="artist-link" @click.stop="goArtist(song)">
            {{ getSingerNames(song.singerinfo, song) || artist.author_name || '-' }}
          </span>
        </div>
        <div class="col-album">
          <span class="album-link" @click.stop="goAlbum(song)">{{ song.albuminfo?.name || song.remark || '-' }}</span>
        </div>
        <div class="col-duration">
          {{ formatDuration(song.timelen) }}
          <div class="action-buttons">
            <button class="icon-btn play-btn-inline" @click.stop="play(song)" title="播放">
              <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 单曲（无限滚动） -->
    <div v-else-if="activeTab==='songs'" class="song-list" ref="scrollArea">
      <div class="list-header">
        <div class="col-index">#</div>
        <div class="col-title">歌曲</div>
        <div class="col-artist">歌手</div>
        <div class="col-album">专辑</div>
        <div class="col-duration">时长</div>
      </div>
      <div v-for="(song, idx) in songs" :key="song.hash || idx" class="song-item" @dblclick="play(song)">
        <div class="col-index">
          <span class="index-number">{{ idx + 1 }}</span>
        </div>
        <div class="col-title">
          <img 
            v-if="song.cover" 
            :src="song.cover.replace('{size}','400')" 
            class="song-cover" 
            :alt="song.name"
            @load="onSongCoverLoad(song, $event)"
            @error="onSongCoverError(song, $event)" 
          />
          <div v-else class="song-cover-placeholder">
            <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor" opacity="0.3">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zM288 421a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0zm224 272c-85.5 0-155.6-67.3-160-151.6a8 8 0 018-8.4h48c4.4 0 8.2 3.6 8 8-1.8 33.2 26.8 61 58 61s59.8-27.8 58-61c-.2-4.4 3.6-8 8-8h48a8 8 0 018 8.4C667.6 625.7 597.5 693 512 693zm176-272a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0z"/>
            </svg>
          </div>
          <div class="song-info">
            <div class="song-name">
              {{ getSongName(song.name) }}
              <span v-if="song.relate_goods && song.relate_goods.some(g => g.level >= 5)" class="quality-badge">SQ</span>
            </div>
          </div>
        </div>
        <div class="col-artist">
          <span class="artist-link" @click.stop="goArtist(song)">
            {{ getSingerNames(song.singerinfo, song) || artist.author_name || '-' }}
          </span>
        </div>
        <div class="col-album">
          <span class="album-link" @click.stop="goAlbum(song)">{{ song.albuminfo?.name || song.remark || '-' }}</span>
        </div>
        <div class="col-duration">
          {{ formatDuration(song.timelen) }}
          <div class="action-buttons">
            <button class="icon-btn play-btn-inline" @click.stop="play(song)" title="播放">
              <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div ref="sentinel" class="sentinel" />
      <div v-if="loadingMore" class="loading">加载中...</div>
    </div>

    <!-- 专辑列表（简单占位） -->
    <div v-else-if="activeTab==='albums'" class="albums">
      <div class="album-item" v-for="(al, i) in albums" :key="al.album_id || i" @click="openAlbum(al)">
        <img 
          v-if="getAlbumCover(al)" 
          :src="getAlbumCover(al)" 
          class="album-cover" 
          :alt="al.album_name || al.name"
          @error="onAlbumCoverError"
        />
        <div v-else class="album-cover-placeholder">
          <svg viewBox="0 0 1024 1024" width="40" height="40" fill="currentColor" opacity="0.3">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zM288 421a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0zm224 272c-85.5 0-155.6-67.3-160-151.6a8 8 0 018-8.4h48c4.4 0 8.2 3.6 8 8-1.8 33.2 26.8 61 58 61s59.8-27.8 58-61c-.2-4.4 3.6-8 8-8h48a8 8 0 018 8.4C667.6 625.7 597.5 693 512 693zm176-272a48.01 48.01 0 0196 0 48.01 48.01 0 01-96 0z"/>
          </svg>
        </div>
        <div class="album-meta">
          <div class="album-name">{{ al.album_name || al.name }}</div>
          <div class="album-date">{{ al.publish_date || '' }}</div>
        </div>
      </div>
      <div v-if="albumsLoading" class="loading">加载中...</div>
    </div>

    <!-- 资料 -->
    <div v-else class="about">
      <pre class="about-text">{{ pretty(artist) }}</pre>
    </div>
  </div>

  <div v-else class="loading-container">
    <img src="../icon/loding.gif" class="loading-gif" alt="加载中" />
    <p>加载中...</p>
  </div>
</template>

<script>
import { getArtistDetail, getArtistAudios, getArtistAlbums, followArtist, unfollowArtist, findArtistByName, getImagesByHash, getAlbumInfo } from '../api/music.js'

export default {
  name: 'ArtistView',
  props: {
    artistId: { type: [String, Number], default: null },
    artistName: { type: String, default: '' }
  },
  emits: ['play', 'navigate'],
  data() {
    return {
      id: this.artistId || null,
      artist: null,
      followed: false,
      activeTab: 'hot',
      // 热门歌曲直接取单曲接口 sort=hot 前10
      hotSongs: [],
      songs: [],
      page: 1,
      pagesize: 30,
      hasMore: true,
      loadingMore: false,
      albums: [],
      albumsPage: 1,
      albumsLoading: false,
      _io: null
    }
  },
  async mounted() {
    console.log('🎨 [ArtistView] 组件挂载，初始参数:', {
      artistId: this.artistId,
      artistName: this.artistName,
      id: this.id
    })
    
    // 如果没有ID但有名称，尝试搜索获取ID
    if (!this.id && this.artistName) {
      console.log('🔍 [ArtistView] 通过名称搜索歌手ID:', this.artistName)
      const found = await findArtistByName(this.artistName)
      console.log('🔍 [ArtistView] 搜索结果:', found)
      if (found?.AuthorId || found?.author_id || found?.ID) {
        this.id = found.AuthorId || found.author_id || found.ID
        console.log('🔍 [ArtistView] 找到歌手ID:', this.id)
      }
    }

    await this.loadArtist()
    await this.loadHot()
    this.$nextTick(() => this.setupInfiniteScroll())
  },
  watch: {
    activeTab(newTab) {
      if (newTab === 'songs' && this.songs.length === 0) {
        this.loadMore()
      } else if (newTab === 'albums' && this.albums.length === 0) {
        this.loadAlbums()
      }
    }
  },
  methods: {
    async loadArtist() {
      const res = await getArtistDetail(this.id)
      const raw = res?.data || res?.info || res?.author || res || null
      // 尽量规范化歌手字段
      const avatar = raw?.sizable_avatar || raw?.avatar || raw?.pic || raw?.sizable_cover || ''
      const name = raw?.author_name || raw?.name || raw?.base?.author_name || raw?.base?.name
      const fans = raw?.fans_cnt || raw?.fans_total || raw?.fans || raw?.follow_cnt || raw?.base?.fans_cnt
      const isFollow = raw?.is_follow || raw?.followed || raw?.isFollow
      this.artist = {
        ...raw,
        author_name: name || raw?.author_name,
        avatar: avatar,
        fans_cnt: typeof fans === 'number' ? fans : Number(fans) || undefined,
        is_follow: Boolean(isFollow)
      }
      this.followed = Boolean(this.artist.is_follow)
    },
    async loadHot() {
      console.log('🎵 [ArtistView] 加载热门歌曲，歌手ID:', this.id)
      const res = await getArtistAudios(this.id, 1, 10, 'hot')
      console.log('🎵 [ArtistView] 热门歌曲API响应:', res)
      
      const list = res?.data?.lists || res?.data?.info || res?.data || res?.lists || []
      console.log('🎵 [ArtistView] 热门歌曲列表原始数据:', list)
      
      this.hotSongs = this.normalizeAudioList(list).slice(0, 10)
      console.log('🎵 [ArtistView] 标准化后的热门歌曲:', this.hotSongs)
      
      if (this.hotSongs.length > 0) {
        console.log('🎵 [ArtistView] 第一首热门歌曲详细信息:', this.hotSongs[0])
      }
      
      // 回填封面
      this.$nextTick(() => {
        this.patchMissingCovers(this.hotSongs)
        this.patchSongCoversFromAlbum(this.hotSongs)
      })
    },
    async loadMore() {
      if (!this.hasMore || this.loadingMore) return
      this.loadingMore = true
      try {
        const res = await getArtistAudios(this.id, this.page, this.pagesize, 'new')
        const list = res?.data?.lists || res?.data?.info || res?.data || res?.lists || []
        const normalized = this.normalizeAudioList(list)
        if (Array.isArray(normalized) && normalized.length > 0) {
          this.songs = this.songs.concat(normalized)
          this.page += 1
          if (normalized.length < this.pagesize) this.hasMore = false
        } else {
          this.hasMore = false
        }
      } finally {
        this.loadingMore = false
      }
      // 回填封面
      this.$nextTick(() => {
        this.patchMissingCovers(this.songs)
        this.patchSongCoversFromAlbum(this.songs)
      })
    },
    setupInfiniteScroll() {
      const sentinel = this.$refs.sentinel
      if (!sentinel) return
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            this.loadMore()
          }
        })
      }, { root: this.$refs.scrollArea, threshold: 0.1 })
      io.observe(sentinel)
      this._io = io
    },
    async patchMissingCovers(list) {
      const need = (list || []).filter(s => !s.cover && s.hash).slice(0, 50)
      console.log('🖼️ [ArtistView] patchMissingCovers: 需要补充封面的歌曲数量:', need.length)
      
      if (need.length === 0) return
      
      try {
        const hashes = need.map(s => s.hash)
        console.log('🖼️ [ArtistView] patchMissingCovers: 请求封面的hashes:', hashes)
        
        const res = await getImagesByHash(hashes, 1)
        console.log('🖼️ [ArtistView] patchMissingCovers: API响应:', res)
        
        const map = res?.data || res?.images || res || {}
        console.log('🖼️ [ArtistView] patchMissingCovers: 封面数据映射:', map)
        
        need.forEach((item, index) => {
          const pics = map[item.hash] || map[item.hash?.toLowerCase()] || []
          console.log(`🖼️ [ArtistView] patchMissingCovers: ${item.name} (${item.hash}) 获取到的图片:`, pics)
          
          const first = Array.isArray(pics) ? pics[0] : null
          const url = first?.sizable_cover || first?.url || first
          
          if (url) {
            const finalUrl = String(url).replace('{size}', '400')
            item.cover = finalUrl
            console.log(`🖼️ [ArtistView] patchMissingCovers: ${item.name} 设置封面:`, finalUrl)
          } else {
            console.log(`🖼️ [ArtistView] patchMissingCovers: ${item.name} 没有找到有效封面`)
          }
        })
      } catch (e) {
        console.error('🖼️ [ArtistView] patchMissingCovers: 补充封面失败:', e)
      }
    },
    
    async patchSongCoversFromAlbum(list) {
      const needAlbumCovers = (list || []).filter(s => s._needAlbumCover && s.album_id)
      console.log('🎼 [ArtistView] patchSongCoversFromAlbum: 需要通过专辑获取封面的歌曲数量:', needAlbumCovers.length)
      
      if (needAlbumCovers.length === 0) return
      
      try {
        const albumIds = Array.from(new Set(needAlbumCovers.map(s => s.album_id)))
        console.log('🎼 [ArtistView] patchSongCoversFromAlbum: 请求的专辑IDs:', albumIds)
        
        const res = await getAlbumInfo(albumIds, 'album_id,sizable_cover,cover')
        console.log('🎼 [ArtistView] patchSongCoversFromAlbum: API响应:', res)
        
        const albumData = res?.data?.list || res?.data || res?.albums || res || []
        console.log('🎼 [ArtistView] patchSongCoversFromAlbum: 专辑数据:', albumData)
        
        // 创建专辑封面映射
        let albumCoverMap = {}
        if (Array.isArray(albumData)) {
          albumData.forEach(album => {
            const key = album.album_id || album.albumid || album.id
            const cover = album.sizable_cover || album.cover
            if (key && cover) {
              albumCoverMap[String(key)] = cover
            }
          })
        }
        
        console.log('🎼 [ArtistView] patchSongCoversFromAlbum: 专辑封面映射:', albumCoverMap)
        
        needAlbumCovers.forEach(song => {
          const albumCover = albumCoverMap[String(song.album_id)]
          if (albumCover) {
            const finalUrl = String(albumCover).replace('{size}', '400')
            song.cover = finalUrl
            console.log(`🎼 [ArtistView] patchSongCoversFromAlbum: ${song.name} 通过专辑设置封面:`, finalUrl)
          } else {
            console.log(`🎼 [ArtistView] patchSongCoversFromAlbum: ${song.name} 的专辑 ${song.album_id} 没有找到封面`)
          }
        })
      } catch (e) {
        console.error('🎼 [ArtistView] patchSongCoversFromAlbum: 通过专辑获取封面失败:', e)
      }
    },
    // 回填专辑封面：按 album_id 批量查询专辑信息并写入 sizable_cover/cover
    async patchAlbumCovers(albumsChunk) {
      const target = (albumsChunk || []).filter(a => !(a.sizable_cover || a.cover) && (a.album_id || a.albumid))
      console.log('🎨 [ArtistView] patchAlbumCovers: 需要补充封面的专辑数量:', target.length)
      
      if (target.length === 0) return
      
      try {
        const ids = Array.from(new Set(target.map(a => a.album_id || a.albumid)))
        console.log('🎨 [ArtistView] patchAlbumCovers: 请求封面的专辑IDs:', ids)
        
        const res = await getAlbumInfo(ids, 'album_id,album_name,sizable_cover,cover')
        console.log('🎨 [ArtistView] patchAlbumCovers: API响应:', res)
        
        const list = res?.data?.list || res?.data || res?.albums || res || []
        console.log('🎨 [ArtistView] patchAlbumCovers: 专辑信息列表:', list)
        
        // 支持 map 或数组两种返回
        let infoMap = {}
        if (Array.isArray(list)) {
          list.forEach(item => {
            const key = item.album_id || item.albumid || item.id
            if (key) infoMap[String(key)] = item
          })
        } else if (typeof list === 'object' && list) {
          infoMap = list
        }
        
        console.log('🎨 [ArtistView] patchAlbumCovers: 专辑信息映射:', infoMap)
        
        target.forEach(a => {
          const key = String(a.album_id || a.albumid)
          const info = infoMap[key] || infoMap[a.album_id] || infoMap[a.albumid]
          console.log(`🎨 [ArtistView] patchAlbumCovers: 专辑 ${a.album_name} (${key}) 获取到的信息:`, info)
          
          const url = info?.sizable_cover || info?.cover
          if (url) {
            const finalUrl = String(url).replace('{size}', '400')
            if (!a.sizable_cover) a.sizable_cover = finalUrl
            else a.sizable_cover = a.sizable_cover.replace('{size}', '400')
            if (!a.cover) a.cover = finalUrl
            console.log(`🎨 [ArtistView] patchAlbumCovers: 专辑 ${a.album_name} 设置封面:`, finalUrl)
          } else {
            console.log(`🎨 [ArtistView] patchAlbumCovers: 专辑 ${a.album_name} 没有找到有效封面`)
          }
        })
      } catch (e) {
        console.error('🎨 [ArtistView] patchAlbumCovers: 补充专辑封面失败:', e)
      }
    },
    // 规整歌曲数据，兼容不同字段
    normalizeAudioList(list) {
      if (!Array.isArray(list)) return []
      return list.map((it, index) => {
        console.log(`🎵 [ArtistView] 规整第${index + 1}首歌曲:`, it)
        
        const hash = it.hash || it.Hash || it.filehash || it.FileHash || it.audio_hash
        const albumAudioId = it.album_audio_id || it.MixSongID || it.mixsongid || it.album_audioid
        // 尝试多种可能的封面字段
        let cover = it.sizable_cover || it.cover || it.img || it.Image || it.imgurl || it.image || 
                   it.album_img || it.album_cover || it.album_sizable_cover || it.pic || it.picture || 
                   it.artwork || it.thumbnail || ''
        
        // 如果还是没有封面，尝试从专辑信息中获取
        if (!cover) {
          const albumInfo = it.album_info || it.albuminfo || {}
          cover = albumInfo.sizable_cover || albumInfo.cover || albumInfo.img || albumInfo.imgurl || ''
        }
        const authors = it.authors || it.singerinfo || []
        
        // 检查所有可能的封面字段
        const coverFields = {
          sizable_cover: it.sizable_cover,
          cover: it.cover,
          img: it.img,
          Image: it.Image,
          imgurl: it.imgurl,
          image: it.image,
          album_img: it.album_img,
          album_cover: it.album_cover,
          album_sizable_cover: it.album_sizable_cover,
          pic: it.pic,
          picture: it.picture,
          artwork: it.artwork,
          thumbnail: it.thumbnail
        }
        
        console.log(`🎵 [ArtistView] 第${index + 1}首歌曲所有可能的封面字段:`, coverFields)
        
        // 如果没有直接的封面，尝试通过专辑信息获取
        const albumInfo = it.album_info || it.albuminfo || {}
        const albumCoverFields = {
          album_sizable_cover: albumInfo.sizable_cover,
          album_cover: albumInfo.cover,
          album_img: albumInfo.img,
          album_imgurl: albumInfo.imgurl
        }
        console.log(`🎵 [ArtistView] 第${index + 1}首歌曲专辑封面字段:`, albumCoverFields)
        
        const singerArray = Array.isArray(authors)
          ? authors.map(a => ({
              id: a.id || a.author_id || a.singerid,
              name: a.name || a.author_name || a.singer_name || a.singername
            })).filter(a => a.name)
          : []
        const singername = singerArray.map(a => a.name).join('、') || it.singername || it.SingerName || it.author_name
        // 名称优先级
        const rawName = it.audio_name || it.song_name || it.name || it.filename || it.remark
        const name = rawName || (typeof it.filename === 'string' ? it.filename.split(' - ').slice(1).join(' - ') : '未知歌曲')
        const albuminfo = it.album_info || it.albuminfo || (it.album_name ? { name: it.album_name } : null)
        const timelen = (it.timelength || it.timelen || it.Duration || it.duration || 0) * (it.Duration || it.duration ? 1000 : 1)
        
        let normalized = {
          ...it,
          hash,
          album_audio_id: albumAudioId || it.album_audio_id,
          cover,
          singerinfo: singerArray,
          singername,
          albuminfo,
          name,
          filename: name,
          timelen
        }
        
        // 保存专辑ID以便后续获取专辑封面
        if (!cover && it.album_id) {
          // 标记这首歌需要通过专辑ID获取封面
          normalized._needAlbumCover = true
        }
        
        console.log(`🎵 [ArtistView] 第${index + 1}首歌曲规整后:`, normalized)
        return normalized
      })
    },
    async loadAlbums() {
      if (this.albumsLoading) return
      this.albumsLoading = true
      try {
        console.log('📀 [ArtistView] 加载专辑，歌手ID:', this.id, '页码:', this.albumsPage)
        const res = await getArtistAlbums(this.id, this.albumsPage, 30, 'new')
        console.log('📀 [ArtistView] 专辑API响应:', res)
        
        const list = res?.data?.lists || res?.data?.albums || res?.data || []
        console.log('📀 [ArtistView] 专辑列表原始数据:', list)
        
        this.albums = this.albums.concat(list)
        console.log('📀 [ArtistView] 当前所有专辑:', this.albums)
        
        if (list.length > 0) {
          console.log('📀 [ArtistView] 第一个专辑详细信息:', list[0])
        }
        
        // 为新增的这批专辑回填封面
        this.$nextTick(() => this.patchAlbumCovers(list))
        this.albumsPage += 1
      } finally {
        this.albumsLoading = false
      }
    },
    async toggleFollow() {
      try {
        if (this.followed) {
          await unfollowArtist(this.id)
          this.followed = false
        } else {
          await followArtist(this.id)
          this.followed = true
        }
      } catch (e) {
        console.error('切换关注失败:', e)
      }
    },
    formatNumber(n) {
      if (typeof n !== 'number') return n
      if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
      if (n >= 10000) return (n / 10000).toFixed(1) + '万'
      return n
    },
    getAvatar(artist) {
      const url = artist?.avatar || artist?.pic || artist?.sizable_avatar || artist?.sizable_cover || ''
      return typeof url === 'string' ? url.replace('{size}', '400') : ''
    },
    getAlbumCover(al) {
      if (!al) {
        console.log('📷 [ArtistView] getAlbumCover: 专辑对象为空')
        return ''
      }
      
      console.log('📷 [ArtistView] getAlbumCover: 专辑对象:', al)
      
      // 尝试多种可能的封面字段
      const url = al.sizable_cover || al.cover || al.img || al.imgurl || al.image || ''
      console.log('📷 [ArtistView] getAlbumCover: 找到的URL字段:', {
        sizable_cover: al.sizable_cover,
        cover: al.cover,
        img: al.img,
        imgurl: al.imgurl,
        image: al.image,
        selected: url
      })
      
      if (!url) {
        console.log('📷 [ArtistView] getAlbumCover: 没有找到有效的封面URL')
        return ''
      }
      
      // 确保是字符串并处理模板
      const finalUrl = typeof url === 'string' ? url.replace('{size}', '400') : String(url)
      console.log('📷 [ArtistView] getAlbumCover: 处理后的URL:', finalUrl)
      
      // 验证URL格式
      if (finalUrl && (finalUrl.startsWith('http://') || finalUrl.startsWith('https://'))) {
        console.log('📷 [ArtistView] getAlbumCover: URL有效，返回:', finalUrl)
        return finalUrl
      }
      
      console.log('📷 [ArtistView] getAlbumCover: URL格式无效')
      return ''
    },
    onAlbumCoverError(event) {
      // 如果图片加载失败，隐藏图片元素
      console.log('📷 [ArtistView] 专辑封面加载失败:', event.target.src)
      event.target.style.display = 'none'
    },
    onSongCoverLoad(song, event) {
      console.log('📷 [ArtistView] 歌曲封面加载成功:', song.name, event.target.src)
    },
    onSongCoverError(song, event) {
      console.log('📷 [ArtistView] 歌曲封面加载失败:', song.name, event.target.src)
      event.target.style.display = 'none'
    },
    getSingerNames(singerinfo, song) {
      if (Array.isArray(singerinfo) && singerinfo.length) {
        return singerinfo.map(s => s.name || s.singer_name || s.singername || s.author_name).filter(Boolean).join('、')
      }
      if (typeof singerinfo === 'string' && singerinfo.trim()) return singerinfo
      return song?.singername || song?.author_name || ''
    },
    getSongName(fullName) {
      if (!fullName) return '未知歌曲'
      const parts = fullName.split(' - ')
      return parts.length > 1 ? parts.slice(1).join(' - ') : fullName
    },
    formatDuration(milliseconds) {
      if (!milliseconds) return '-'
      const seconds = Math.floor(milliseconds / 1000)
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    play(song) {
      this.$emit('play', song)
    },
    goArtist(song) {
      const id = this.getPrimaryArtistId(song)
      const name = this.getPrimaryArtistName(song)
      this.$emit('navigate', 'artist', { id, name })
    },
    goAlbum(song) {
      const s = song || {}
      const id =
        s.album_id ||
        s.albumid ||
        s.AlbumID ||
        s.base?.album_id ||
        s.album?.id ||
        s.album_info?.album_id ||
        s.album_info?.id ||
        s.albuminfo?.album_id ||
        s.albuminfo?.id ||
        null
      const name = (s.albuminfo && s.albuminfo.name) || s.album_name || s.remark || s.album_info?.album_name || s.album || ''
      if (id) {
        this.$emit('navigate', 'album', { id, name })
      }
    },
    openAlbum(al) {
      const a = al || {}
      const id = a.album_id || a.albumid || a.id || a.base?.album_id
      const name = a.album_name || a.name || a.album_info?.album_name || ''
      if (id) {
        this.$emit('navigate', 'album', { id, name })
      }
    },
    // 提取首个歌手ID
    getPrimaryArtistId(song) {
      const s = song || {}
      if (s.SingerId || s.singerid || s.AuthorId || s.author_id) return s.SingerId || s.singerid || s.AuthorId || s.author_id
      if (Array.isArray(s.singerinfo) && s.singerinfo.length) {
        const first = s.singerinfo[0]
        return first?.id || first?.singerid || first?.author_id || null
      }
      return null
    },
    // 提取首个歌手名
    getPrimaryArtistName(song) {
      const s = song || {}
      if (s.SingerName || s.singername || s.author_name) return s.SingerName || s.singername || s.author_name
      if (Array.isArray(s.singerinfo) && s.singerinfo.length) {
        const first = s.singerinfo[0]
        return first?.name || first?.singer_name || first?.singername || first?.author_name || null
      }
      // 从 "歌手 - 歌名" 中分离
      if (typeof s.name === 'string' && s.name.includes(' - ')) {
        return s.name.split(' - ')[0]
      }
      return null
    },
    pretty(val) {
      try { return JSON.stringify(val, null, 2) } catch { return String(val) }
    }
  },
  beforeUnmount() {
    if (this._io) this._io.disconnect()
  }
}
</script>

<style scoped>
.artist-view { padding: var(--spacing-xl); max-width: 1400px; margin: 0 auto; }
.artist-header { display: flex; gap: var(--spacing-lg); align-items: center; margin-bottom: var(--spacing-lg); }
.avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; }
.name { font-size: var(--font-size-2xl); margin: 0; }
.stats { color: var(--color-text-secondary); margin-top: 4px; }
.actions { margin-top: 8px; }
.primary-btn { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--color-primary); background: var(--color-primary); color: #fff; cursor: pointer; }
.primary-btn.outline { background: transparent; color: var(--color-primary); }

.tabs { display: flex; gap: 8px; margin-bottom: var(--spacing-md); }
.tabs button { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-background-light); color: var(--color-text); cursor: pointer; }
.tabs .active { border-color: var(--color-primary); color: var(--color-primary); }

/* 歌曲列表样式 - 与 FavoriteView 保持一致 */
.song-list {
  background: var(--color-background-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.list-header,
.song-item {
  display: grid;
  grid-template-columns: 60px 1fr 200px 200px 120px;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
}

.list-header {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  border-bottom: 1px solid var(--color-border);
  font-weight: 500;
}

.song-item {
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
  cursor: pointer;
}

.song-item:last-child {
  border-bottom: none;
}

.song-item:hover {
  background: var(--color-background);
}

.song-item.playing {
  background: var(--bg-focus);
}

.song-item.playing .song-name {
  color: var(--color-primary);
}

/* 列样式 */
.col-index {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  justify-content: center;
}

.index-number {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.col-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.song-cover-placeholder {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
}

.song-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
  flex: 1;
}

.song-name {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.quality-badge {
  padding: 1px 4px;
  background: var(--bg-focus-medium);
  color: var(--color-primary);
  font-size: 10px;
  border-radius: 2px;
  font-weight: 500;
  flex-shrink: 0;
  border: 1px solid var(--color-primary);
}

.col-artist,
.col-album {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-link {
  cursor: pointer;
}

.artist-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.album-link {
  cursor: pointer;
}

.album-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.col-duration {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.song-item:hover .action-buttons {
  opacity: 1;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.icon-btn:hover {
  background: var(--color-background);
  color: var(--color-text);
}

.play-btn-inline {
  color: var(--color-text);
}

.play-btn-inline:hover {
  color: var(--color-primary);
  transform: scale(1.1);
}

.loading-container { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  padding: var(--spacing-xl) 0; 
  color: var(--color-text-secondary); 
}
.loading-gif { 
  width: 60px; 
  height: 60px; 
  margin-bottom: var(--spacing-md); 
}
.loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.sentinel { 
  height: 1px; 
  width: 100%;
}
/* 专辑列表样式 */
.albums {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
}

.album-item {
  background: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.album-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.album-cover {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--color-background);
}

.album-cover-placeholder {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.album-meta {
  margin-top: var(--spacing-sm);
}

.album-name {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.album-date {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
/* 资料页面 */
.about {
  padding: var(--spacing-lg);
}

.about-text {
  white-space: pre-wrap;
  background: var(--color-background-light);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  font-family: 'Courier New', monospace;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
  max-height: 600px;
  overflow-y: auto;
}
</style>
