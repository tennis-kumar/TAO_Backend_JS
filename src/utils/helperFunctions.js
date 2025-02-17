// 🔥  Updated Analytics Logger Function
const logAnalytics = async (alias, req, ip) => {
  const userAgent = useragent.parse(req.headers["user-agent"]);
  const geo = geoip.lookup(ip) || {}; // Get geolocation data

  const os = userAgent.os.family || "Unknown";
  const device = userAgent.device.family || "Unknown";
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  // Update Analytics collection
  const analyticsEntry = new Analytics({
    alias,
    timestamp: new Date(),
    userAgent: req.headers["user-agent"],
    os,
    device,
    ip,
    location: {
      country: geo.country || "Unknown",
      city: geo.city || "Unknown",
    },
  });

  await analyticsEntry.save();

  // Update URL Analytics in the URL collection
  const urlEntry = await Url.findOne({ shortUrl: alias });

  if (urlEntry) {
    // Add unique user IP if not already present
    const isNewUser = !urlEntry.uniqueUsers.includes(ip);
    if (isNewUser) {
      urlEntry.uniqueUsers.push(ip);
    }

    // Update clicksByDate
    const dateEntry = urlEntry.clicksByDate.find((entry) => entry.date === currentDate);
    if (dateEntry) {
      dateEntry.count += 1;
    } else {
      urlEntry.clicksByDate.push({ date: currentDate, count: 1 });
    }

    // Update OS analytics
    const osEntry = urlEntry.osType.find((entry) => entry.osName === os);
    if (osEntry) {
      osEntry.uniqueClicks += 1;
      if (isNewUser) osEntry.uniqueUsers += 1;
    } else {
      urlEntry.osType.push({ osName: os, uniqueClicks: 1, uniqueUsers: isNewUser ? 1 : 0 });
    }

    // Update Device analytics
    const deviceEntry = urlEntry.deviceType.find((entry) => entry.deviceName === device);
    if (deviceEntry) {
      deviceEntry.uniqueClicks += 1;
      if (isNewUser) deviceEntry.uniqueUsers += 1;
    } else {
      urlEntry.deviceType.push({
        deviceName: device,
        uniqueClicks: 1,
        uniqueUsers: isNewUser ? 1 : 0,
      });
    }

    await urlEntry.save();
  }
};