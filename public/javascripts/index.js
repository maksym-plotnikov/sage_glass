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
  if (window.getSelection) {
    let range = document.createRange();
    console.log(range.selectNode(document.getElementById(containerid)));
    range.selectNode(document.getElementById(containerid));
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeRange(range);
  }
}

$('.copy-text').on('click', function () {
  const itemId = $(this).attr("data-id");
  console.log(itemId);
  CopyToClipboard(itemId);
});

$('.copy-size').on('click', function () {
  const itemId = $(this).attr("data-size");
  CopyToClipboard(itemId);
});