yelp.search({term: "food", location: req.query.searchTerm}, function(error, data) {
    var pineapple = function(){
      res.render('main/results', {results:results})
    }
    var business_count = data.businesses.length
    var results = [];
    var commentCalls = data.businesses.map(function(item) {
      return function(callback) {
        // res.send(callback.toString())
        // db.comment.findAndCountAll({
        //  where:{yelp_id: item.id},
      //      attributes: [
      //        sequelize.fn('sum', sequelize.col('love')),
      //        sequelize.fn('sum', sequelize.col('hate'))]
        db.comment.sum('love', {where: {yelp_id: item.id}}).then(function (loves) {
          // res.send(loves)

          db.comment.sum('hate', {where: {yelp_id: item.id}}).then(function(hates) {
            // if(result.rows.length == 2){
            //  loves = result.rows[0]
            //  hates = result.rows[0]
            // }
            results.push({
              id: item.id,
              name: item.name,
              love: loves,
              hate: hates,
            });

            callback();
            // console.log('Pineapples!')
          // res.send(results)
        });
      });



        // results.push(item.id);
        callback();
      }
    });

  async.parallel(commentCalls, function(err, result) {
    res.render('main/results', {results:results})
  });


 });




      // db.comment.sum('love', {where:{yelp_id: data.id}}).then(function(loveSum){
      //  db.comment.sum('hate', {where:{yelp_id: data.id}}).then(function(hateSum){
      //    res.render('main/results', {results:results});
      //  });

      // res.send(results);
    // });

//    db.comment.findAll({
//      where:{
//        yelp_id: data.id,
//      }
//    }).then(function(comments){
//      db.comment.sum('love', {where:{yelp_id: data.id}}).then(function(loveSum){
//        db.comment.sum('hate', {where:{yelp_id: data.id}}).then(function(hateSum){
//    res.render('main/results', {data: data.businesses,comments:comments, loveSum:loveSum, hateSum:hateSum});
//    });
//      });
//    });
  // });