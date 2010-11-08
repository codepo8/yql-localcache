yqlcache = function(){

  /* globals for JSON callback, check for cache support */
  var cacheid,cb,
      cancache = (("localStorage" in window) &&
                  window["localStorage"] !== null);

  /* get the data - expects a transaction object */
  function get(transaction){
    if(!transaction.id || !transaction.callback ||
       !transaction.yql || !transaction.cacheage){ return }

    var current,data;
    cb = transaction.callback;
    cacheid = transaction.id;

    /* if caching is not supported, just call YQL */
    if(!cancache){
      loadYQL(transaction.yql);
    }

    /* if caching is supported */
    if(cancache){

      /* retrieve the cache and see if it has data */
      current = JSON.parse(localStorage[cacheid]);
      if(current !== null){

        /* if the cache time is less than the cacheage return it*/
        if((new Date().getTime() - current.time) < transaction.cacheage){
          cb({type:"cached",data:current.data});

        /* if the cache is older than the max age, prime the cache */
        } else {
          loadYQL(transaction.yql);
        }

      /* if the cache has no data, load from YQL again */
      } else {
        loadYQL(transaction.yql);
      }
    }
  }

  /* bog standard JSON-P call function to get data from YQL */
  function loadYQL(yql){
    var old = document.getElementById("yqloadscript");
    if(old){ old.parentNode.removeChild(old); }
    var YQL = "http://query.yahooapis.com/v1/public/yql?q="+
               encodeURIComponent(yql)+"&diagnostics=false&format=json"+ 
               "&callback=yqlcache.cache";
    var s = document.createElement("script");
    s.setAttribute("type","text/javascript");
    s.id = "yqloadscript";
    s.setAttribute("src",YQL);
    document.getElementsByTagName("head")[0].appendChild(s);
  }
  
  /* Caching function */
  function cache(data){
    var out;

    /* if YQL was successful, get the data */
    if(data.query && data.query.results){
      var out = data.query.results;

      /* if caching is supported, get a timestamp, prime the cache 
         and call the callback */

      if(cancache){
        var timestamp = new Date().getTime();
        localStorage[cacheid] = JSON.stringify({time:timestamp,data:out});
        cb({type:"freshcache",data:out});

      /* otherwise just call the callback */ 
      } else {
        cb({type:"live",data:out});
      }
    } 
  }
  return{cache:cache,get:get};
}();