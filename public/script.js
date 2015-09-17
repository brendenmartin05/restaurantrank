$(window).load(function(){

  $('#love').click(function(e){
    $('#total_score').val(parseInt($('#total_score').val())+1);
    $('#love_score').val(parseInt($('#love_score').val())+1);
    $('#show_love').text($('#love_score').val());
  });

  $('#hate').click(function(e){
    $('#total_score').val(parseInt($('#total_score').val())-1);
    $('#hate_score').val(parseInt($('#hate_score').val())-1);
    $('#show_hate').text($('#hate_score').val());
  });

  $('.comment-delete').click(function(e) {
    e.preventDefault();
    var button = $(this);
    console.log(button.attr('href'));
    $.ajax({
      url: button.attr("href"),
      method: "DELETE"
    }).done(function(data) {
      if (data.msg === "OK")
        button.parent().remove();
    });
  });




})