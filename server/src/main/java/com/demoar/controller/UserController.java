package com.demoar.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demoar.dto.ApiResponse;
import com.demoar.entity.FavoritePlace;
import com.demoar.entity.FavoriteRoute;
import com.demoar.entity.NavigationRecord;
import com.demoar.mapper.FavoritePlaceMapper;
import com.demoar.mapper.FavoriteRouteMapper;
import com.demoar.mapper.NavigationRecordMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 收藏 & 历史记录 Controller
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private FavoritePlaceMapper favoritePlaceMapper;

    @Autowired
    private FavoriteRouteMapper favoriteRouteMapper;

    @Autowired
    private NavigationRecordMapper navigationRecordMapper;

    // ============ 收藏地点 ============

    /** 获取收藏地点列表 */
    @GetMapping("/favorites/places")
    public ApiResponse<List<FavoritePlace>> listFavoritePlaces(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<FavoritePlace> list = favoritePlaceMapper.selectList(
            new LambdaQueryWrapper<FavoritePlace>().eq(FavoritePlace::getUserId, userId)
        );
        return ApiResponse.success(list);
    }

    /** 添加收藏地点 */
    @PostMapping("/favorites/places")
    public ApiResponse<FavoritePlace> addFavoritePlace(
        @RequestBody FavoritePlace place,
        HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        place.setUserId(userId);
        // 防重复
        FavoritePlace exist = favoritePlaceMapper.selectOne(
            new LambdaQueryWrapper<FavoritePlace>()
                .eq(FavoritePlace::getUserId, userId)
                .eq(FavoritePlace::getLatitude, place.getLatitude())
                .eq(FavoritePlace::getLongitude, place.getLongitude())
        );
        if (exist != null) {
            return ApiResponse.fail("该地点已收藏");
        }
        favoritePlaceMapper.insert(place);
        return ApiResponse.success(place);
    }

    /** 删除收藏地点 */
    @DeleteMapping("/favorites/places/{id}")
    public ApiResponse<Void> removeFavoritePlace(
        @PathVariable Long id,
        HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        FavoritePlace exist = favoritePlaceMapper.selectById(id);
        if (exist == null || !exist.getUserId().equals(userId)) {
            return ApiResponse.fail(404, "收藏不存在");
        }
        favoritePlaceMapper.deleteById(id);
        return ApiResponse.success();
    }

    // ============ 收藏路线 ============

    @GetMapping("/favorites/routes")
    public ApiResponse<List<FavoriteRoute>> listFavoriteRoutes(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<FavoriteRoute> list = favoriteRouteMapper.selectList(
            new LambdaQueryWrapper<FavoriteRoute>().eq(FavoriteRoute::getUserId, userId)
        );
        return ApiResponse.success(list);
    }

    @PostMapping("/favorites/routes")
    public ApiResponse<FavoriteRoute> addFavoriteRoute(
        @RequestBody FavoriteRoute route,
        HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        route.setUserId(userId);
        favoriteRouteMapper.insert(route);
        return ApiResponse.success(route);
    }

    @DeleteMapping("/favorites/routes/{id}")
    public ApiResponse<Void> removeFavoriteRoute(
        @PathVariable Long id,
        HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        FavoriteRoute exist = favoriteRouteMapper.selectById(id);
        if (exist == null || !exist.getUserId().equals(userId)) {
            return ApiResponse.fail(404, "路线不存在");
        }
        favoriteRouteMapper.deleteById(id);
        return ApiResponse.success();
    }

    // ============ 导航历史 ============

    /** 获取导航历史 */
    @GetMapping("/history")
    public ApiResponse<List<NavigationRecord>> listHistory(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<NavigationRecord> list = navigationRecordMapper.selectList(
            new LambdaQueryWrapper<NavigationRecord>()
                .eq(NavigationRecord::getUserId, userId)
                .orderByDesc(NavigationRecord::getCreatedAt)
                .last("LIMIT 50")
        );
        return ApiResponse.success(list);
    }

    /** 保存导航记录 */
    @PostMapping("/history")
    public ApiResponse<NavigationRecord> saveHistory(
        @RequestBody NavigationRecord record,
        HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        record.setUserId(userId);
        navigationRecordMapper.insert(record);
        return ApiResponse.success(record);
    }

    /** 删除导航记录 */
    @DeleteMapping("/history/{id}")
    public ApiResponse<Void> removeHistory(
        @PathVariable Long id,
        HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        NavigationRecord exist = navigationRecordMapper.selectById(id);
        if (exist == null || !exist.getUserId().equals(userId)) {
            return ApiResponse.fail(404, "记录不存在");
        }
        navigationRecordMapper.deleteById(id);
        return ApiResponse.success();
    }
}
