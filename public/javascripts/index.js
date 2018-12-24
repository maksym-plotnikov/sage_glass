$('button.delete').on('click', function () {
  const item = $(this).attr('data-item');
  console.log(item);
  $.ajax({
    method: "POST",
    url: "files/delete",
    data: {"file": item},
    success: function (result) {
      location.reload()
    }
  })
});