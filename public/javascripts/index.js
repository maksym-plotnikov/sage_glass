$('button.delete').on('click', function () {
  const item = $(this).attr('data-item');
  console.log(item);
  $.ajax({
    method: "POST",
    url: "files/delete",
    data: {"file": item},
    success: function (result) {
      location.reload();
    }
  });
});

function CopyToClipboard(containerid) {
  if (document.selection) {
    const range = document.body.createTextRange();
    range.moveToElementText(document.getElementById(containerid));
    range.select().createTextRange();
    document.execCommand("copy");
  } else if (window.getSelection) {
    var range = document.createRange();
    range.selectNode(document.getElementById(containerid));
    window.getSelection().addRange(range);
    document.execCommand("copy");
  }
}

$('.copy-text').on('click', function () {
  const itemId = $(this).attr("data-id");
  CopyToClipboard(itemId);
});

$('.copy-size').on('click', function () {
  const itemId = $(this).attr("data-size");
  CopyToClipboard(itemId);
});