/*-------------------------
------  簡易環境設定  -----
-------------------------*/

//設定環境變數
let process = {
    env:{
        server: 'prod'
    }
}

//設定環境變數中sever為dev時顯示console.log()
function log(args){
    if(process.env.server === 'dev')
    console.log(args)
}

/*---------------------------------
------------設定共用變數------------
---------------------------------*/

//搜尋範圍設定
const searchRadius = [200,400,800,1000]
// 目前位置
let currentLocation
//使用的google地圖
let map
//啟用的google api service
let service
//搜尋半徑
let radius
//原有的資料
let getData
//新取得的資料
let newData
//圖標
let marker
// 向google map api發送請求
let request

//初始化執行
function initMap(){
    if(navigator.geolocation){
        $('#search').html(searchRadius[0])
        ResetLocal('search')
        ResetLocal('search_results')
        $('.search-item').html('尚未搜尋')
        Position()
        CurrentPos()
    }else(
        modal('裝置不支援!')
    )
}

/*-------------------------------
---- 設定點擊按鈕需使用的函式  ---
--------------------------------*/

//根據按鈕觸發相對應是件
$(document).click(function(event){
    if(event.target == $('#getPos')[0]){
        $('.search-item').html('尚未搜尋')
        Position()
        CurrentPos()
        ResetLocal('search')
    }else if(event.target == $('.menu-btn')[0]){
        $('nav').toggleClass('menu-off')
    }else if(event.target == $('#restaurant')[0]){
        //先清空資料避免不停重複輸出
        $('.search-item').html('')
        CurrentPos()
        GetPosTarget('restaurant')
        NearBySearchAPI(request)
    }else if(event.target == $('#tourist_attraction')[0]){
        //先清空資料避免不停重複輸出
        $('.search-item').html('')
        CurrentPos()
        GetPosTarget('tourist_attraction')
        NearBySearchAPI(request)
    }else if(event.target == $('#gas_station')[0]){
        //先清空資料避免不停重複輸出
        $('.search-item').html('')
        CurrentPos()
        GetPosTarget('gas_station')
        NearBySearchAPI(request)
    }else if(event.target == $('.arrow-left')[0]){
        SearchRadiusChange(-1)
        ResetLocal('search')
        ResetLocal('search_results')
    }else if(event.target == $('.arrow-right')[0]){
        SearchRadiusChange(1)
        ResetLocal('search')
        ResetLocal('search_results')
    }
})

/*-------------------------------
-----------   函式區   -----------
--------------------------------*/


/* 基礎函式 */

// 延遲用的sleep函式
//利用ES6的Promise執行一個指定(time)的延遲
function sleep(time){
    return new Promise((resolve) => {
        setTimeout(resolve,time)
    })
}

//  取得定位資料
function Position(){
    // navigator.geolocation.getCurrentPosition為HTML5中的Geolocation API使用瀏覽器取得定位
    // getCurrentPosition(執行成功函式,執行失敗函式)
    navigator.geolocation.getCurrentPosition(GetPosSuccess,GetPosError)
    log('取得位置!')
}

//  呼叫google map api將目前位置放置於地圖上
function CurrentPos(){
    currentLocation = JSON.parse(localStorage.getItem('location'))
    map = new google.maps.Map(document.querySelector('#map'),{zoom: 16,center:currentLocation})
    //設定目前位置座標
    let marker = new google.maps.Marker({
        position:currentLocation,
    })
    //設定infowindow
    let infowindow = new google.maps.InfoWindow({
        content : '<div class="currentPos">目前位置</div>'
    })
    //開啟infowindow
    infowindow.open(map,marker)  
    marker.addListener('click', function() {
            infowindow.open(map,marker)
    })
    //指定圖標要出現的地圖
    marker.setMap(map)

    log('定位成功!')
}

//  設定搜尋半徑
function SearchRadiusChange(value){
    let setRadius = Number($('#search').text())
    let changeIndex = (searchRadius.indexOf(setRadius) + value + searchRadius.length) % searchRadius.length
    index = searchRadius[changeIndex]

    return $('#search').html(searchRadius[changeIndex])
}

//  重置localstorage中的search陣列
function ResetLocal(localdata){
    localStorage.setItem(localdata,'[]')

    log(`清除${localdata}!`)
}

//搜尋半徑顯示
function RadiusCircle(){
    return new google.maps.Circle({
        strokeColor: '#00bfff',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: '#87cefa',
        fillOpacity: 0.35,
        map: map,
        center: currentLocation,
        radius: Number(radius)
    });
}

//  取得目標位置
function GetPosTarget(target){
    radius = $('#search').text()

    //發送要給nearbysearch請求的內容
    request = {
        location: currentLocation,
        radius: radius,
        type: [target],
    }

    RadiusCircle()

    log('目標地點取得')
}

//取得placeId後存入localstorage,之後由Place libery:Details取得更詳細資料
function getDetails(place){
    let position = JSON.parse(localStorage.getItem('search'))

    let data = {placeId:place.place_id}

    position.push(data)
    newData = JSON.stringify(position)
    localStorage.setItem('search',newData)
    log('placeId寫入完成')

    let detailRequest = data

    service = new google.maps.places.PlacesService(map);
    service.getDetails(detailRequest, Details)
    log('取得詳細資料API')
}

// 呼叫google map api使用Place libery:Nearby Search Request
function NearBySearchAPI(nearbyrequest){
    service = new google.maps.places.PlacesService(map)
    service.nearbySearch(nearbyrequest, NearBySearch)

    $('#loading').css({'opacity':'1','display':'block'})
}

// bootstrap4彈出式提示視窗
function modal(content){
    $('#Modal').modal('show')
    $('.modal-body').html(content)
}

// 清單點擊資料綁定
function ListClick(){
    let btn = document.querySelectorAll('.place')
    
    btn.forEach((results,index) => {
        results.addEventListener('click', () =>{
            let getData = JSON.parse(localStorage.getItem('search_results'))

            let infowindowContent = 
            `
            <div>名稱:${getData[index].name}</div>
            <div>評價:${getData[index].rating}<i class="fas fa-star"></i></div>
            <div>地址:${getData[index].address}</div>
            <div>連絡電話:${getData[index].phone_number}</div>
            <div><a href="${getData[index].url}">googlemap中開啟</a></div>
            `

            // 提高zIndex讓訊息視窗
            infowindow = new google.maps.InfoWindow(
                {
                    content: infowindowContent,
                    zIndex: 9999,
                }           
            )

            marker = new google.maps.Marker({
                position: getData[index].location,
                map: map,
            })
            
            infowindow.open(map, marker);
        })
    })
    log('清單綁定完成')
}


/* callback function */

//執行navigator.geolocation.getCurrentPosition成功的函式
//會執行callback function取得position物件
function GetPosSuccess(position){
    //latitude=緯度,longitude=經度
    let currentLat = position.coords.latitude
    let currentLng = position.coords.longitude
    let location = {lat: currentLat,lng: currentLng}

    currentLocation = location
    //將取得的目前座標存入localstorage
    newData = JSON.stringify(location)
    localStorage.setItem('location',newData)
}

//無法取得定位時的函式
function GetPosError(){
    modal('無法取得位置')
}

//呼叫google map 的nearbysearch要callback的函式
function NearBySearch(results, status ,pagination){
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        log('地點搜尋中')

        // forEach取得每一筆資料,避免query_limit所以加上setTimeout進行delay
        results.forEach((place,index) => {
            setTimeout(() =>{
                getDetails(place)
            },index * 300)
        })

        //google map最多呼叫1頁=20筆資料,接收額外回傳的資料判斷是否有下一頁
        //最多可取得3頁=60筆資料
        if (pagination.hasNextPage) {
            log('尚有資料')
            $('.more').css({'opacity':'1','display':'block'})

            $('.more').on('click',() => {
                $('#loading').css({'opacity':'1','display':'block'})
                sleep(2000).then(() => {
                    pagination.nextPage()
                })
            })
        }else{
            log('沒有更多資料了')
            $('.more').css('opacity','0')
        }

        // 等待所有項目渲染到網頁上再將各個項目綁定點擊事件
        setTimeout(()=>{
            ListClick()
            $('#loading').css({'opacity':'0','display':'none'})
        },results.length * 305)

    }else if(status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS){
        $('#loading').css({'opacity':'0','display':'none'})
        modal('沒有選取的目標地點!')
        $('.search-item').html('沒有搜尋到目標')
    }else{
        log(status)
        $('#loading').css({'opacity':'0','display':'none'})
        modal('Woops!出現錯誤!')
    }
}

//呼叫google map的place deatil要callback的函式
function Details(details,status){
    if(status == google.maps.places.PlacesServiceStatus.OK){

        //判斷是否有評價
        let rating
        
        if(details.rating){
            rating = details.rating
        }else{
            rating = '沒有評價' 
        }

        //判斷是否有營業時間
        let open_hours,IsOpenNow

        if(details.opening_hours){
            open_hours = details.opening_hours.weekday_text
            if(details.opening_hours.isOpen()){
                IsOpenNow = '<span class="badge badge-success float-right">營業中</span>'
            }else{
                IsOpenNow = '<span class="badge badge-danger float-right">尚未營業</span>'
            }
        }else{
            open_hours = '沒有營業時間資料'
            IsOpenNow = '<span class="badge badge-warning float-right">沒有營業時間資料</span>'
        }

        //將nearbysearch取得的所有地點存入localstorage
        let palce_details = JSON.parse(localStorage.getItem('search_results'))
        
        // 寫入localstorage且經過處理的資料
        let data = {
            location:details.geometry.location,
            name:details.name,
            address: details.vicinity,
            rating: rating,
            phone_number: details.formatted_phone_number,
            opening_hours: open_hours,
            IsOpen: IsOpenNow, 
            url: details.url
        }

        palce_details.push(data)
        newData = JSON.stringify(palce_details)
        localStorage.setItem('search_results',newData)

        log('資料寫入完成')

        // 設置圖標
        marker = new google.maps.Marker({
            position: data.location,
            animation: google.maps.Animation.DROP,
            map: map
        })

        // 渲染出處理過資料的項目
        $('.search-item').append(
            `
            <button class="btn btn-outline-info btn-lg btn-block mb-3 place" type="button"">
                ${details.name}
                ${IsOpenNow}
            </button>
            `
        )
        log('項目渲染完成')
    }else{
        log(status)
    }
}