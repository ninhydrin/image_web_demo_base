<template>
  <div class="row">
    <div class="col-4">
      <img :src="state.src" ref="input_img" style="max-width:100%; max-height: 100%">
      <div>
        <input type="file" accept="image/jpeg,image/png" @change="onImageChange"/>
      </div>
    </div>
    <div class="col-4">
      <div class="row">
        <div class="col-12 canvas-area">
          <canvas class="myCanvas" ref="canvas" :width="canvas_w" :height="canvas_h" @mousedown="drag_start" @mouseup="drag_end" @mouseout="drag_end" @mousemove="move"></canvas>
        </div>
        <div class="col-12">
          <input type="range" min="0.1" max="3" step="0.1" v-model="scale" @change="update" style="width:100%" :disabled="mode=='mask'">
        </div>
        <div class="btn-group col-12" role="group" aria-label="Basic radio toggle button group">
          <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked v-model="mode" value="mask">
          <label class="btn btn-outline-primary" for="btnradio1">マスク</label>

          <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" v-model="mode" value="move">
          <label class="btn btn-outline-primary" for="btnradio2">大きさ・移動</label>
        </div>
        <button class="btn btn-primary col-12" type="button" @click="post">送信</button>
      </div>
    </div>
    <div class="col-4">
        <img :src="state.result_src" style="max-width:100%; max-height: 100%">
    </div>
    <div class="col-12" style="visibility: hidden">
      <canvas class="myCanvas" ref="mask_canvas" :width="canvas_w" :height="canvas_h"></canvas>
    </div>

  </div>
</template>


<style scoped>
.myCanvas {
 border: 1px solid #000000;
 /* width: 100%; */
 /* height: auto; */
 background-color: white;
 top: 0px;
}
.canvas-area {
  widows: 100%;
  height: auto;
}
</style>

<script>
export default Vue.defineComponent({
  name: "hoge",
  setup(){
    let is_mousedown = false; // PCでのムーブフラグ
    let sx = 0, sy = 0;
    let ctx, mask_ctx
    let ix = 0, iy = 0
    let v = 1.0   // 拡大縮小率
    let isDrag
    const canvas_w = 300, canvas_h = 300
    const slider_value = Vue.ref(null)
    const mode = Vue.ref("move")

    const canvas = Vue.ref(null)
    const mask_canvas = Vue.ref(null)
    const input_img = Vue.ref(null)
    const scale = Vue.ref(1)

    const state = Vue.reactive({
      src: "/static/img/test_img.jpg",
      result_src: "/static/img/test_img.jpg",
    })

    const is_move = ()=> mode.value == "move"
    const drag_start = (e) =>{
      if(is_move()) drag_move_start(e)
      else drag_mask_start(e)
    }

    const drag_move_start = (_ev) => {
      is_mousedown = true
      sx = _ev.pageX
      sy = _ev.pageY
    }

    const drag_mask_start = (e) => {
      ctx.beginPath();
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();

      mask_ctx.beginPath();
      mask_ctx.lineTo(e.offsetX, e.offsetY);
      mask_ctx.stroke();

      isDrag = true;
    }

    const move = (e)=>{
      if(is_move()) move_move(e)
      else mask_move(e)
    }

    const move_move = (_ev) => {// canvas ドラッグ中
        if (!is_mousedown) return
        const cw = canvas.value.width
        const ch = canvas.value.height
        const ow = cw, oh = ch
        draw_canvas(ix + (sx - _ev.pageX) / v, iy + (sy - _ev.pageY) / v, ow, oh)
        return false
    }
    const mask_move = (e)=>{
      if(!isDrag) return
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      mask_ctx.lineTo(e.offsetX, e.offsetY);
      mask_ctx.stroke();
    }

    const drag_end = (e) => {
      if(is_move()) drag_move_end(e)
      else drag_mask_end(e)
    }

    const drag_move_end = (_ev) => {
        if (!is_mousedown) return
        is_mousedown = false
        const cw = canvas.value.width
        const ch = canvas.value.height
        const ow = cw * 2, oh = ch * 2
        draw_canvas(ix += (sx - _ev.pageX) / v, iy += (sy - _ev.pageY) / v, ow, oh)
    }
    const drag_mask_end = (e)=>{
      ctx.closePath();
      mask_ctx.closePath();
      isDrag = false;
    }

    const slider_scaling = (_v)=>{        // スライダーが変わった
        const cw = canvas.value.width
        const ch = canvas.value.height
        const ow = cw * 2, oh = ch * 2
        scaling(_v, cvs, cw, ch, ow, oh)
    }

    const wheel = (_ev) => {// canvas ホイールで拡大縮小
        // これがないと、ホイールすると、ページがスクロールしてしまう。
        if (_ev.preventDefault) {
            _ev.preventDefault();
        }
        _ev.returnValue = false;

        let scl = parseInt(parseInt(scale.value.value) + _ev.wheelDelta * 0.05)
        if (scl < 10) scl = 10
        if (scl > 400) scl = 400
        scale.value.value = scl
        const cw = canvas.value.width
        const ch = canvas.value.height
        const ow = cw, oh = ch
        scaling(scl, cvs, cw, ch, ow, oh)
    }

    function scaling(_v, cvs, cw, ch, ow, oh) {        // スライダーが変わった
    v = parseInt(_v) * 0.01
    draw_canvas(ix, iy, ow, oh)
}

    const clear = () =>{
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
      mask_ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    }

    const onImageChange = (e) => {
      const images = e.target.files || e.dataTransfer.files
      getBase64(images[0])
        .then(image => state.src = image)
        .catch(error => setError(error, '画像のアップロードに失敗しました。'))
    }
    const mask_clear = ()=>{
      mask_ctx.fillStyle = "white"
      const cw = canvas.value.width, ch = canvas.value.height
      mask_ctx.fillRect(0, 0, cw, ch)    // 背景を塗る
      mask_ctx.fillStyle = "black"
    }
    let canvas_img_h, canvas_img_w
    const setImg = () =>{
      clear()
      mask_clear()
      const img_h = input_img.value.naturalHeight, img_w = input_img.value.naturalWidth
      let x, y
      ix = canvas.value.width / 2
      iy = canvas.value.height / 2

      if(img_h > img_w){
        canvas_img_h = canvas.value.height
        canvas_img_w = img_w / img_h * canvas.value.width
        y = 0
        x = (canvas.value.width - canvas_img_w) /2
        ix -= x
      }else{
        canvas_img_w = canvas.value.width
        canvas_img_h = img_h / img_w * canvas.value.height
        x = 0
        y = (canvas.value.height - canvas_img_h) / 2
        iy -= y
      }
      drawBackground()
      ctx.drawImage(input_img.value, x, y, canvas_img_w, canvas_img_h)
    }

    const getBase64 = (file)=>{
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })
    }

    const drawBackground = ()=>{
      const cw = canvas.value.width, ch = canvas.value.height
      ctx.fillStyle = "rgb(220, 220, 220)"
      // ctx.fillStyle = "white"
      ctx.fillRect(0, 0, cw, ch)    // 背景を塗る
    }

    const draw_canvas = (_x, _y, ow, oh) => {
      mask_clear()
      const img = input_img.value
      const cw = canvas.value.width, ch = canvas.value.height
      const img_h = input_img.value.naturalHeight, img_w = input_img.value.naturalWidth
      v = scale.value
      drawBackground()
      ctx.drawImage(img,
          0, 0, img_w, img_h,
          (cw / 2) - _x * v, (ch / 2) - _y * v, canvas_img_w * v, canvas_img_h * v,
      )
      ctx.strokeStyle = "rgba(0, 0, 0)"
      // ctx.strokeRect((cw - ow) / 2, (ch - oh) / 2, ow, oh) // 赤い枠
    }

    const update = ()=>{
      const cw = canvas.value.width
      const ch = canvas.value.height
      const ow = cw * 2, oh = ch * 2
      draw_canvas(ix, iy, ow, oh)
      console.log(mode)
    }

    const post = ()=>{
      const img = input_img.value
      const fd = new FormData()
      const tmp_canvas = document.createElement("canvas"), tmp_ctx = tmp_canvas.getContext("2d")
      tmp_canvas.height = tmp_canvas.width = canvas_w
      const cw = canvas.value.width, ch = canvas.value.height
      const img_h = input_img.value.naturalHeight, img_w = input_img.value.naturalWidth
      tmp_ctx.drawImage(img,
        0, 0, img_w, img_h,
        (cw / 2) - ix * v, (ch / 2) - iy * v, canvas_img_w * v, canvas_img_h * v,
      )
      fd.set("img", tmp_canvas.toDataURL())
      fd.set("mask", mask_canvas.value.toDataURL())
      console.log(fd.get("mask"))
      return
      fetch("/post", {method: "POST"}).then((res)=>{
        if(!res.ok)console.log("error")
        return res.json()
      }).then((data)=>{
        console.log(data)
      })
    }
    Vue.onMounted(()=>{
      ctx = canvas.value.getContext('2d')
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#000000";

      mask_ctx = mask_canvas.value.getContext('2d')
      mask_ctx.lineCap = 'round';
      mask_ctx.lineJoin = 'round';
      mask_ctx.lineWidth = 5;
      mask_ctx.strokeStyle = "#000000";


      input_img.value.onload = setImg
    })
    return {canvas, state, drag_start, input_img, move, drag_end, onImageChange, scale, slider_scaling, slider_value, update, mode, mask_canvas, canvas_w, canvas_h, post}
  }
})
</script>
