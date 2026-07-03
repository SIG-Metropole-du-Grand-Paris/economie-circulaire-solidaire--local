# leaflet-sidebar-v2

A responsive sidebar _just_ for [Leaflet](http://leafletjs.com/). A fork of [sidebar-v2](http://turbo87.github.io/sidebar-v2) that only contains the necessary ingredients for use in Leaflet.

![Demo](doc/sidebar-v2.gif)

## [Leaflet](http://leafletjs.com/)

![Sidebar collapsed](doc/leaflet-1.png) ![Sidebar extended](doc/leaflet-2.png)

## Why the Fork?
I wanted to `npm install` sidebar-v2 for a Leaflet project which required the `main` and `style` fields in [`package.json`](package.json). This fork removes the Google Maps and OpenLayers files since I don't need them in the npm package.

## Usage

### API
leaflet-sidebar-v2 provides a simple API to dynamically modify the sidebar. All functions may be chained.

#### creation
```js
var sidebar = L.control.sidebar('sidebar').addTo(map);
```

#### modification

```js
/* add a new panel */
var panelContent = {
    id: 'userinfo',                     // UID, used to access the panel
    tab: '<i class="fa fa-gear"></i>',  // content can be passed as HTML string,
    pane: someDomNode.innerHTML,        // DOM elements can be passed, too
    position: 'bottom'                  // vertical alignment, 'top' or 'bottom'
};
sidebar.addPanel(panelContent);

/* remove a panel */
sidebar.removePanel('userinfo');

/* en- / disable a panel */
sidebar.disablePanel('userinfo');
sidebar.enablePanel('userinfo');
```

#### open / close / show content
```js
/* open a panel */
sidebar.open('userinfo');

/* close the sidebar */
sidebar.close();
```

### markup
If you use the sidebar with static content only, you can predefine content in HTML:

```html
<div id="sidebar" class="sidebar collapsed">
    <!-- Nav tabs -->
    <div class="sidebar-tabs">
        <ul role="tablist"> <!-- top aligned tabs -->
            <li><a href="#home" role="tab"><i class="fa fa-bars"></i></a></li>
            <li class="disabled"><a href="#messages" role="tab"><i class="fa fa-envelope"></i></a></li>
            <li><a href="#profile" role="tab"><i class="fa fa-user"></i></a></li>
        </ul>

        <ul role="tablist"> <!-- bottom aligned tabs -->
            <li><a href="#settings" role="tab"><i class="fa fa-gear"></i></a></li>
        </ul>
    </div>

    <!-- Tab panes -->
    <div class="sidebar-content">
        <div class="sidebar-pane" id="home">
            <h1 class="sidebar-header">
                sidebar-v2
                <div class="sidebar-close"><i class="fa fa-caret-left"></i></div>
            </h1>
            <p>A responsive sidebar for mapping libraries</p>
        </div>

        <div class="sidebar-pane" id="messages">
            <h1 class="sidebar-header">Messages<div class="sidebar-close"><i class="fa fa-caret-left"></i></div></h1>
        </div>

        <div class="sidebar-pane" id="profile">
            <h1 class="sidebar-header">Profile<div class="sidebar-close"><i class="fa fa-caret-left"></i></div></h1>
        </div>
    </div>
</div>
```

You still need to initialize the sidebar (see API.creation)

### Events

The sidebar fires 3 types of events:
`opening`, `closing`, and `content`.
The latter has a payload including the id of the activated content div.

You can listen for them like this:
```js
sidebar.on('content', function(e) {
    // e.id contains the id of the opened panel
})
```


## License

leaflet-sidebar-v2 is free software, and may be redistributed under the [MIT license](LICENSE).
