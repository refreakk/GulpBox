<?php
/*
Инструкция
В head-е подключить скрипт для каждой формы

<script type="text/javascript" src="/sender.php?id=testForm&popup_id=successPopup"></script>

В src указываем путь к скрипту
Через GET-запрос передаем либо id, либо уникальный класс тега <form>
?id= 				имеет приоритет над классом
?class=				должен быть уникальным
а также можно передать id блока, который будет показан при успешном сабмите
&popup_id=			должен быть уникальным

При удачном сабмите также происходит event "form_submitted". На него можно вешать свою логику.
*/

const EMAIL   = 'support@domain.com';
const FROM    = 'Domain <support@domain.com>';
const SUBJECT = 'Question from Domain';

const FIELDS = array(
	'first_name' => [
		'label' => 'Имя',
		'required' => true,
	],
	'last_name' => [
		'label' => 'Фамилия',
		'required' => true,
	],
	'phone_number' => [
		'label' => 'Номер телефона',
        'required' => true,
	],
	'email' => [
		'label' => 'E-mail',
		'required' => true,
	],
	'country' => [
		'label' => 'Страна',
	],
	'language' => [
		'label' => 'Язык поддержки',
	],
	'time_to_call' => [
		'label' => 'Удобное время для дзвонка',
	],
	'name_page' => [
		'label' => 'Отправлено с формы '
	]
);


$selfPath = $_SERVER["SCRIPT_NAME"];

if (isset($_GET["class"]) || isset($_GET["id"]))
{
	$formId = "";

	if (isset($_GET["class"])) {
		$formId = "." . $_GET["class"];
	}

	if (isset($_GET["id"]))	{
		$formId = "#" . $_GET["id"];
	}

	$popupId = isset($_GET["popup_id"]) ? "#" . $_GET["popup_id"] : null;

	if ($formId) {

		header('Content-Type: application/javascript');

		?>
		$( document ).ready(function() {

		var currentLanguge = definesLanguage(),
		errorText = {
		requiredText: {
		en: "This field is required",
		ru: "Это поле обязательно для заполнения",
		es: "Este campo es requerido",
		de: "Dieses Feld wird benötigt",
		fr: "Ce champ est requis",
		it: "Questo campo è obbligatorio",
		zh: "这是必填栏",
		},
		minlength_2: {
		en: "Please enter at least 2 characters",
		ru: "Введите не менее 2 символов",
		es: "Por favor ingrese al menos 2 caracteres",
		de: "Bitte geben Sie mindestens 2 Zeichen ein",
		fr: "Veuillez saisir au moins 2 caractères",
		it: "Inserisci almeno 2 caratteri",
		zh: "请输入至少2个字符",
		},
		maxlength_30: {
		en: "Enter up to 30 characters",
		ru: "Введите не более 30 символов",
		es: "Ingrese hasta 30 caracteres",
		de: "Geben Sie bis zu 30 Zeichen ein",
		fr: "Entrez jusqu'à 30 caractères",
		it: "Inserisci fino a 30 caratteri",
		zh: "输入最多30个字符",
		},
		emailText: {
		en: "Invalid email address",
		ru: "Недопустимый электронный адрес",
		es: "Dirección de correo electrónico no válida",
		de: "Ungültige E-Mail-Adresse",
		fr: "Adresse e-mail invalide",
		it: "indirizzo email non valido",
		zh: "无效的邮件地址",
		},
		maxlength_50: {
		en: "Enter up to 50 characters",
		ru: "Введите не более 50 символов",
		es: "Ingrese hasta 50 caracteres",
		de: "Geben Sie bis zu 50 Zeichen ein",
		fr: "Entrez jusqu'à 50 caractères",
		it: "Inserisci fino a 50 caratteri",
		zh: "输入最多50个字符",
		},
		};

		$("<?php echo $formId;?>").attr("action","<?php echo $selfPath;?>");
		$(document).on("focus","<?php echo $formId;?>",function(){
		if(!($("<?php echo $formId;?>").find(".arfield").length)) {


		$('<?php echo $formId;?>').validate({
		rules: {
		first_name: {
		required: true,
		minlength: 2,
		maxlength: 30
		},
		last_name: {
		required: true,
		minlength: 2,
		maxlength: 30
		},
		phone_number: {
		required: true,
		minlength: 2,
		maxlength: 50
		},
		email: {
		required: true,
		email: true,
		newEmailRules: true
		},
		language: {
		required: true,
		},
		agreement: {
		required: true,
		}
		},
		messages: {
		first_name: {
		required: errorText.requiredText[currentLanguge],
		minlength: errorText.minlength_2[currentLanguge],
		maxlength: errorText.maxlength_30[currentLanguge]
		},
		last_name: {
		required: errorText.requiredText[currentLanguge],
		minlength: errorText.minlength_2[currentLanguge],
		maxlength: errorText.maxlength_30[currentLanguge]
		},
		phone_number: {
		required: errorText.requiredText[currentLanguge],
		minlength: errorText.minlength_2[currentLanguge],
		maxlength: errorText.maxlength_50[currentLanguge]
		},
		email: {
		required: errorText.requiredText[currentLanguge],
		email: errorText.emailText[currentLanguge],
		newEmailRules: errorText.emailText[currentLanguge]
		},
		language: {
		required: errorText.requiredText[currentLanguge],
		},
		agreement: {
		required: errorText.requiredText[currentLanguge],
		}
		},
		submitHandler: function (form) {
		$.ajax({
		type: "POST",
		url: "<?php echo $selfPath;?>",
		data: {arfield: "field", form:"<?php echo $formId;?>"},
		success: function(data) {
		$('<?php echo $formId;?>').append(data);
		$.ajax({
		type: "POST",
		url: "<?php echo $selfPath;?>",
		data: {arfield: "code", form:"<?php echo $formId;?>"},
		success: function(data) {
		$('<?php echo $formId;?>').find(".arfield").val(data);
		var formData = {};
		$.map($('<?php echo $formId;?>').serializeArray(), function(n, i) {
		formData[n['name']] = n['value'];
		});
		$.post("<?php echo $selfPath;?>", formData, function(response) {
		response = JSON.parse(response);
		if (response.status) {

		$(document).trigger("form_submitted");
		<?php if ($popupId): ?>
			$("<?php echo $popupId ?>").show();
		<?php endif ?>
		}
		});
		}
		});
		}
		});
		}
		});


		}
		});

		function definesLanguage() {
		var pageUrl = location.pathname.split('/');
		var curLanguage;
		for (var i = 0; i < pageUrl.length; i++) {
		if (pageUrl[i] == 'ru' || pageUrl[i] == 'es' || pageUrl[i] == 'de' || pageUrl[i] == 'fr' || pageUrl[i] == 'it' || pageUrl[i] == 'zh') {
		curLanguage = pageUrl[i];
		break;
		} else {
		curLanguage = "en";
		}
		}

		return curLanguage;
		}

		});



		<?php
	}

}


if (isset($_REQUEST['arfield'])) {

	if (session_status() == PHP_SESSION_NONE) session_start();

	switch($_REQUEST['arfield']) {
		case 'field':
			$_SESSION[$_REQUEST["form"]] = md5(uniqid()); // создаем проверочный пароль
			echo "<input type='hidden' name='arfield' class='arfield'><input type='hidden' name='form_name' value='" . $_REQUEST["form"] . "'>";
			break;
		case 'code':
			echo $_SESSION[$_REQUEST["form"]]; // возвращаем проверочный пароль
			break;
	}

}

if (isset($_REQUEST['form_name'])) {

	if (session_status() == PHP_SESSION_NONE) session_start();

	if (isset($_REQUEST['arfield']) &&
		isset($_SESSION[$_REQUEST["form_name"]]) &&
		$_REQUEST['arfield'] == $_SESSION[$_REQUEST["form_name"]]) { // проверяем проверочный пароль

		$formData = array_fill_keys(array_keys(FIELDS), null);
		$isValid = true;
		foreach (FIELDS as $fieldName => $fieldOptions) {
			if (!empty($_POST[$fieldName])) {
				$formData[$fieldName] = htmlspecialchars($_POST[$fieldName]);
			} else if (isset($fieldOptions['required']) && $fieldOptions['required'] == true) {
				$isValid = false;
			}
		}

		if (!$isValid || !array_filter($formData)) {
			echo json_encode([
				'status' => false,
				'error' => 'All or required fields are missing',
			]);
			return;
		}

		$messageBody = '
			<br /><br />' .
			implode('<br />', array_map(function($name, $value) {
				return FIELDS[$name]['label'] . ': ' . $value;
			}, array_keys($formData), $formData)) . '<br />';

		set_error_handler(function ($severity, $message, $file, $line) {
			throw new Exception($message, 0);
		});

		try {

			mail(EMAIL, SUBJECT, $messageBody, "From: " . FROM . " \r\n  \r\n"."MIME-Version: 1.0\r\n"."Content-type: text/html; charset=utf-8\r\n");

			unset($_SESSION[$_REQUEST["form_name"]]); // очищаем проверочный пароль

			echo json_encode(['status' => true]);

		} catch (Exception $e) {
			echo json_encode(['status' => false, 'error' => $e->getMessage()]);
			return;
		}


	} else {

		echo json_encode([
			'status' => false,
			'error' => 'Password already expired'
		]);

	}
}
