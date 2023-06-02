# Modified Gossip 1.0 From gossip-ink/gossip
Please visit the https://github.com/gossip-ink/gossip for more information about this project.

# Notice
There are design changes that I made to this app, these are removing the the text: "Gossip" in the header also some header items changes. I remove these for a special case (The width is smaller that was 
orginally intended by the developer). Also other minor changes.

# Installation
Use YARN when installing packages also, the packages used in the project are optimize for Node 16.xx so, if your are using the latest node version, consider a downgrade.

# Running
Once all packages are installed, use command: npm run start

# Building
Use: npm run build to start building your project. One to note that, modifiy the generated
index.html code to:

``javascript
<script>
    window.routerBase = `the exact location of the index.html in the server`;
</script>
``

For example, if the index html is at: localhost:3000/dist/index.html, then:

``javascript
<script>
    //needs to be properly set or the app will display a blank page
    window.routerBase = `dist/index.html`;
    //or this:
    window.routerBase = `dist/`;
</script>
``
