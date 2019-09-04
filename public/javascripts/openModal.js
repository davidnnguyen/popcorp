$(document).ready(function() {
  // Get the modal
  var modal = document.getElementById('myModal');

  var mytable = document.getElementById("entriesTable");

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  $('#entriesTable tbody tr').on('click', function (event) {
    console.log($(this).attr('id'));
    let entryId = $(this).attr('id');

    $.get('/entries', {id: entryId}, function (data) {
        $('#modalAlert').hide();

        let name = data.name;
        let dob = data.dob;
        let gender = data.gender;
        let phone = data.phone;
        let email = data.email;
        let decName = data.decName;

        let rowHtml = '<tr><td>' + name +'</td><td>' + dob + '</td><td>' + gender + '</td><td>' + phone + '</td><td>' + email + '</td></tr>';
        $('#clearTextTable tbody').append(rowHtml);


        if(name === decName) {
          $('#clearTextTable').show();
        }else{
          $('#clearTextTable').hide();
          $('#modalAlert').html('Error: Incorrect DEK used to decrypt data');
          $('#modalAlert').show();
        }


      }).fail(function (error) {
        $('#clearTextTable').hide();
        $('#modalAlert').html(error.responseJSON.errorMsg);
        $('#modalAlert').show();
      }).always(function () {
        modal.style.display = "block";
      });
  });

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
    document.getElementById("clearTextTable").deleteRow(1);
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
      document.getElementById("clearTextTable").deleteRow(1);
    }
  }
});
