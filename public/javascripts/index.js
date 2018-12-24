
function CopyToClipboard(containerid) {
  console.log(document.getElementById(containerid));
  if (window.getSelection) {
    let range = document.createRange();
    range.selectNode(document.getElementById(containerid));
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeRange(range);
  }
}


$('button.delete').on('click', function () {
  const item = $(this).attr('data-item');
  $.ajax({
    method: "POST",
    url: "files/delete",
    data: {"file": item},
    success: function (result) {
      location.reload();
    }
  });
});

$('.copy-text').on('click', function () {
  const itemId = $(this).attr("data-id");
  CopyToClipboard(itemId);
});

$('.copy-size').on('click', function () {
  const itemId = $(this).attr("data-size");
  CopyToClipboard(itemId);
});

$('.copy-link').on('click', function () {
  const itemId = $(this).prev().attr("id");
  console.log(itemId);
  CopyToClipboard(itemId);
});
