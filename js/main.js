const xmlApi =
  "https://alleghenycityrealty.managebuilding.com/Resident/PublicPages/XMLRentals.ashx";

// Changes XML to JSON
function xmlToJson(xml) {
  // Create the return object
  var obj = {};

  if (xml.nodeType == 1) {
    // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) {
    // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      if (typeof obj[nodeName] == "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof obj[nodeName].push == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
}

const request = new XMLHttpRequest();
request.open("GET", xmlApi, false);
request.send();
const xml = request.responseXML;
const jsonData = xmlToJson(xml);
const properitesList = document.getElementById("properites-list");
const allProperties = jsonData.PhysicalProperty.Property;
const typeOfProperties = [];

const changePropery = (selectedAddress) => {
  window.localStorage.setItem('property', selectedAddress);
  window.location.href = '/property';
};

const fetchElement = (elementID) => document.getElementById(elementID);

const showProperty = () => {
  const selectedProperty = window.localStorage.getItem('property');
  const activeProperty = allProperties.filter(({ PropertyID }) => {
    const addressInfo = PropertyID.Address;
    const address = addressInfo.Address["#text"];
    return address === selectedProperty;
  })[0];

  const PropertyID = activeProperty.PropertyID;
  const Floorplan = activeProperty.Floorplan;
  const Information = activeProperty.Information;
  const addressInfo = PropertyID.Address;
  const city = addressInfo.City["#text"];
  const state = addressInfo.State["#text"];
  const postalcode = addressInfo.PostalCode["#text"];
  const room = Floorplan.Room;
  const roomDetail = room[0].Comment["#text"];
  const bathDetail = room[1].Comment["#text"];
  const sqFeet = Floorplan.SquareFeet["@attributes"].Min;
  const files = Floorplan.File;
  const effectiveRent = Floorplan.EffectiveRent;
  const minRent = parseInt(effectiveRent["@attributes"].Min, 10);
  const maxRent = parseInt(effectiveRent["@attributes"].Max, 10);
  const actualRent = (maxRent + minRent) / 2;
  const amenities = Floorplan.Amenity;
  const description = Information.LongDescription["#text"];
  const deposit = Floorplan.Deposit.Amount.ValueRange['@attributes'].Exact;
  const idUrl = activeProperty.Floorplan.FloorplanAvailabilityURL['#text'];
  const propertyId = idUrl.substring(idUrl.indexOf('buildingid=') + 11, idUrl.indexOf('buildingid=') + 11 + 6);
  const unitId = idUrl.substring(idUrl.indexOf('unitid=') + 7, idUrl.indexOf('unitid=') + 7 + 6);
  const listingId = idUrl.substring(idUrl.indexOf('listingId=') + 10, idUrl.indexOf('listingId=') + 10 + 6);
  fetchElement('intro_title').innerHTML = `${selectedProperty}, ${state} ${postalcode} 
    <a href="https://www.google.com/maps/place/${selectedProperty}${city},${state} ${postalcode}"><i class="fa fa-map"></i></a>`;
  fetchElement('intro_price').innerHTML = `$${actualRent}/M`;
  fetchElement('room_num').innerHTML = roomDetail;
  fetchElement('bath_num').innerHTML = bathDetail;
  fetchElement('sq_feet').innerHTML = sqFeet !== '0' ? `${sqFeet} Sq Ft` : 'N/A';
  fetchElement('description').innerHTML = description;
  fetchElement('infoRequest').href = `https://alleghenycityrealty.managebuilding.com/Resident/Public/Contact?propertyId=${propertyId}&unitId=${unitId}`;
  fetchElement('applySuit').href = `https://alleghenycityrealty.managebuilding.com/Resident/apps/rentalapp/?listingId=${listingId}&hidenav=true`;

  fetchElement('lease_terms').innerHTML = `<span>Lease Terms :</span> $${deposit} security deposit`;
  const numOfSlides = Math.ceil(files.length / 4);
  let filesChunk = [];
  const slidesArray = new Array(numOfSlides).fill(0);
  slidesArray.map((file, i) => {
    filesChunk.push(files.splice(0, 4))
  })
  console.log(filesChunk);
  if (fetchElement('intro_slider').innerHTML === '') {
    filesChunk.map((chunk, i) => {
      fetchElement('intro_slider').innerHTML =
        fetchElement('intro_slider').innerHTML +
        `<div class="carousel-item ${ i === 0 ? 'active' : ''}">
          <div class="row">
            ${chunk.map((file, i) => {
              const string =  `<div class="col-lg-3 col-md-4 col-xs-6 thumb">
                <a href="${file.Src["#text"]}" class="fancybox" rel="ligthbox">
                  <img src="${file.Src["#text"]}" class="zoom img-fluid"  alt="">
                </a>
              </div>`
              return string;
            })}
          </div>
        </div>`
    });

    fetchElement('intro_slider').innerHTML = fetchElement('intro_slider').innerHTML.replace(/,/g, '')
  }
  if (fetchElement('intro_tags').innerHTML === '') {
    amenities.map(({ Description }) => {
      fetchElement('intro_tags').innerHTML =
        fetchElement('intro_tags').innerHTML +
        `<li><a href="#">${Description['#text']}</a></li>`
    });
  }
}

const showProperties = (properties, update = false) => {
  if (update) {
    properitesList.innerHTML = "";
  }

  properties.map(({ PropertyID, Floorplan, Information, ILS_Identification }) => {
    const typeOfProperty = ILS_Identification["@attributes"].ILS_IdentificationType;
    typeOfProperties.push(typeOfProperty);
    const addressInfo = PropertyID.Address;
    const address = addressInfo.Address["#text"];
    const city = addressInfo.City["#text"];
    const state = addressInfo.State["#text"];
    const postalcode = addressInfo.PostalCode["#text"];
    const room = Floorplan.Room;
    const roomDetail = room[0].Comment["#text"];
    const bathDetail = room[1].Comment["#text"];
    const files = Floorplan.File;
    const imageSrc = files[0].Src["#text"];
    const effectiveRent = Floorplan.EffectiveRent;
    const minRent = parseInt(effectiveRent["@attributes"].Min, 10);
    const maxRent = parseInt(effectiveRent["@attributes"].Max, 10);
    const actualRent = (maxRent + minRent) / 2;
    const description = Information.LongDescription["#text"];
    const hasAvailability = description.includes("Available");
    const replaceStars = description.replace(/\*/g, ''); 
    const indexOFA = replaceStars.indexOf("A"); 
    const availablity = replaceStars.substr(
      indexOFA === 0 ? 0 : indexOFA - 1,
      replaceStars.match(/[0-9]/)['index'] + 1
    );
    const property = `
      <div class="col-md-6" onclick="changePropery('${address}')">
        <div class="property-item set-bg" data-setbg="${imageSrc}">
          <div class="rent-notic">${hasAvailability ? availablity : "For Rent"}</div>
          <div class="property-info text-white">
            <div class="info-warp">
              <h5>${address}</h5>
              <p class="property-description">
                ${description.substr(0, 110)}...
              </p>
              <p><i class="fa fa-map-marker"></i> ${city}, ${state} ${postalcode}</p>
              <p><i class="fa fa-bath"></i> ${roomDetail}, ${bathDetail}</p>
            </div>
            <div class="price">$${actualRent}/month</div>
          </div>
        </div>
      </div>
    `;

    properitesList.insertAdjacentHTML("beforeend", property);
  });

  $(".set-bg").each(function () {
    var bg = $(this).data("setbg");
    $(this).css("background-image", "url(" + bg + ")");
  });

  if (!update) {
    const types = document.getElementById('typeOfProperty');
    [...new Set(typeOfProperties)].map(type => {
      types.innerHTML = types.innerHTML + `
    <option value="${type}">${type}</option>
  `;
    })
  }
};

const url = window.location.href;
const currentPage = url.substring(url.lastIndexOf('/') + 1);
console.log(currentPage);
if (currentPage) {
 showProperties(allProperties);
} else {
  showProperty();
};

const search = () => {
  document.getElementById("submitButton").click();
};

const onSubmit = (e) => {
  e.preventDefault();
  const searchText = document.getElementById("search").value;
  const searchTextLC = searchText.toLowerCase();
  filteredProperites = allProperties.filter(({ PropertyID, Information }) => {
    const addressInfo = PropertyID.Address;
    const address = addressInfo.Address["#text"].toLowerCase();
    const city = addressInfo.City["#text"].toLowerCase();
    const state = addressInfo.State["#text"].toLowerCase();
    const postalcode = addressInfo.PostalCode["#text"].toLowerCase();
    const description = Information.LongDescription["#text"].toLowerCase();
    const filter =
      description.includes(searchTextLC) ||
      address.includes(searchTextLC) ||
      city.includes(searchTextLC) ||
      state.includes(searchTextLC) ||
      postalcode.includes(searchTextLC);

    return filter;
  });

  showProperties(filteredProperites, true);
};

const changeHandler = (e) => {
  const beds = document.getElementById("numOfBeds").value;
  const baths = document.getElementById("numOfBaths").value;
  const type = document.getElementById("typeOfProperty").value;
  const price = document.getElementById("priceRange").value;
  document.getElementById("selectedPrice").innerHTML = `$${price}`;
  filteredProperites = allProperties.filter(({ Floorplan, ILS_Identification }) => {
    const room = Floorplan.Room;
    const bedCount = room[0].Count["#text"];
    const bathCount = room[1].Count["#text"];
    const effectiveRent = Floorplan.EffectiveRent;
    const minRent = parseInt(effectiveRent["@attributes"].Min, 10);
    const maxRent = parseInt(effectiveRent["@attributes"].Max, 10);
    const actualRent = (maxRent + minRent) / 2;
    const typeOfProperty = ILS_Identification["@attributes"].ILS_IdentificationType;
    let filter = bedCount > beds && bathCount > baths && actualRent > price
    if (type) {
      filter = filter && typeOfProperty === type;
    }

    return filter;
  });
  showProperties(filteredProperites, true);
};
