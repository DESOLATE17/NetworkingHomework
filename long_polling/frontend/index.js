const list = document.getElementById("list"); // список ответов от сервера
const startButton = document.getElementById("start"); // кнопка запуска long polling запросов
const finishButton = document.getElementById("finish"); // кнопка завершения long polling запросов
let isPolling = false; // текущее состояние запросов

const generatingPolynomial = "1011";
let verificationMatrix = ["1", "10", "100", "11", "110", "111", "101"];

let corruptedPolynomial;
let encodedPolynomial;
let errorCount; 
let originalPolynomial;

const decoding = (data) => {
	({corruptedPolynomial, encodedPolynomial, errorCount, originalPolynomial} = data);

	const remainder = getDividingRemainder(corruptedPolynomial);

	let index = verificationMatrix.findIndex(element => element === remainder);

	let decodedPolynomial = corruptedPolynomial.slice(0, corruptedPolynomial.length - 3);

	if (index < 0) {
		if (originalPolynomial === decodedPolynomial) {
			return message(originalPolynomial,
			 encodedPolynomial, corruptedPolynomial, decodedPolynomial, errorCount,
			 1);
		} else {
			return message(originalPolynomial,
			 encodedPolynomial, corruptedPolynomial, decodedPolynomial, errorCount,
			 4);
		}
	} else {
		index = corruptedPolynomial.length - index - 1;

		let correctedPolynomial = corruptedPolynomial.substring(0, index) + String(corruptedPolynomial[index] ^ 1) + 
				corruptedPolynomial.substring(index + 1);

		decodedPolynomial = correctedPolynomial.slice(0, corruptedPolynomial.length - 3);

		if (originalPolynomial === decodedPolynomial) {
			return message(originalPolynomial,
			 encodedPolynomial, corruptedPolynomial, decodedPolynomial, errorCount,
			 2);
		} else {
			return message(originalPolynomial,
			 encodedPolynomial, corruptedPolynomial, decodedPolynomial, errorCount,
			 3)
		}
	}
}

const getDividingRemainder = (polynomial) => {
	let indexEnd = generatingPolynomial.length - 1;
	let currentDigit = polynomial.slice(0, indexEnd + 1);
	let remainder;

	while (indexEnd < polynomial.length) {
		remainder = (parseInt(currentDigit, 2) ^ parseInt(generatingPolynomial, 2)).toString(2);
		currentDigit = remainder;

		if ((++indexEnd) < polynomial.length) {
			while (indexEnd < polynomial.length && currentDigit.length < generatingPolynomial.length) {
				currentDigit += polynomial[indexEnd++];
				currentDigit = String(+currentDigit);
			}
			
			if (currentDigit.length < generatingPolynomial.length) {
				remainder = currentDigit;
			} else {
				indexEnd--;
			}
		}
	}
	
	return remainder;
}

const subscribe = async () => {
	try {
		const response = await fetch("/long-polling-request");

		const node = document.createElement("div");
		node.style.marginBottom = "1em";

		if (response.status === 200) {
			const data = await response.json();
			node.innerHTML = decoding(data);
		} else if (response.status === 502) {
			node.innerText = `Превышено время ожидания ответа от сервера`;
		}

		list.appendChild(node);

		// если соединение еще не прервано, то рекурсивно запускаем функцию subscribe
		if (isPolling) {
			subscribe();
		}
	} catch (e) {
		// если в процессе запроса возникла непредвиденная ошибка на сервере, то запускаем функцию через 1с
		setTimeout(() => {
			// если соединение еще не прервано, то рекурсивно запускаем функцию subscribe
			if (isPolling) {
				subscribe();
			}
		}, 1000);
	}
};

// функция вызывается при нажатии на кнопку "начать"
const startConnectToServer = () => {
	finishButton.disabled = false;
	startButton.disabled = true;
	isPolling = true;

	subscribe();
};

// функция вызывается при нажатии на кнопку "закончить"
const finishConnectToServer = () => {
	startButton.disabled = false;
	finishButton.disabled = true;
	isPolling = false;
};

startButton.addEventListener("click", startConnectToServer);
finishButton.addEventListener("click", finishConnectToServer);


const statusList = {
	1: "Ошибки не было",
	2: "Ошибка была, получилось исправить",
	3: "Ошибка была, не смогли исправить",
	4: "Ошибка была, не нашли",
  }
  
const message = (original, encoded, corrupted, decoded, errorCount, status) => {
	  return `
  <div class="message message-${status}">
	<div class="errors_count">Количество ошибок: ${errorCount}.  ${statusList[status]}</div>
	
	<div class="comparison">
	  <div>
		<div class="comparison__message corrupted">
		  <div class="title">Полученное сообщение: </div>
		  <div class="content">${corrupted}</div>
		</div>
		<div class="comparison__message encoded">
		  <div class="title">Отправленное сообщение: </div>
		  <div class="content">${encoded}</div>
		</div>
	  </div>
  
	  <div>
		<div class="comparison__message decoded">
		  <div class="title">Раскодированное сообщение: </div>
		  <div class="content">${decoded}</div>
		</div>
		<div class="comparison__message original">
		  <div class="title">Оригинальное сообщение: </div>
		  <div class="content">${original}</div>
		</div>
	  </div>
	</div>
  </div>
	  `;
  }